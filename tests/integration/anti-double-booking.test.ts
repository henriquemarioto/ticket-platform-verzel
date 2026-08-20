import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as reserveSeatsRoute } from "@/app/api/seats/reserve/route";
import { POST as reserveGARoute } from "@/app/api/reservations/general-admission/route";
import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { mockCookies } from "../setup";

describe("Anti-Double Booking ACID Concurrency Tests (UC10, UC11, UC30)", () => {
  let isDbAvailable = false;
  const TEST_PREFIX = `test-acid-${Date.now()}`;
  let organizerId: string;
  let eventId: string;
  let numberedSectorId: string;
  let seatA1Id: string;
  let gaSectorId: string;
  const customerIds: string[] = [];
  const customerTokens: string[] = [];

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    } catch (e) {
      console.warn(
        "\n⚠️  [Integration Tests] Banco de dados indisponível.\n" +
        "   Para executar os testes de integração:\n" +
        "   - Suba o banco com: docker compose up -d postgres\n" +
        "   - Ou execute dentro do container: docker compose exec app npm test\n" +
        "   - Para rodar apenas os testes unitários: npm run test:unit\n"
      );
      return;
    }

    // 1. Create Organizer
    const organizer = await prisma.user.create({
      data: {
        name: "Organizer ACID Test",
        email: `${TEST_PREFIX}-org@example.com`,
        passwordHash: "hash123",
        role: "ORGANIZER",
      },
    });
    organizerId = organizer.id;

    // 2. Create Event
    const event = await prisma.event.create({
      data: {
        title: `${TEST_PREFIX} Concurrency Event`,
        description: "A".repeat(300),
        category: "SHOW",
        bannerUrl: "https://example.com/banner.jpg",
        locationName: "Estádio Teste",
        city: "São Paulo, SP",
        eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        entryStartTime: new Date(Date.now() + 22 * 60 * 60 * 1000),
        organizerId,
      },
    });
    eventId = event.id;

    // 3. Create Numbered Sector with Seat A1
    const numberedSector = await prisma.sector.create({
      data: {
        eventId,
        name: "Cadeiras VIP",
        type: "NUMBERED_SEATS",
        price: 200.0,
        totalCapacity: 10,
        availableCapacity: 10,
      },
    });
    numberedSectorId = numberedSector.id;

    const seatA1 = await prisma.seat.create({
      data: {
        sectorId: numberedSectorId,
        row: "A",
        number: 1,
        status: "AVAILABLE",
      },
    });
    seatA1Id = seatA1.id;

    // 4. Create General Admission Sector with totalCapacity = 5
    const gaSector = await prisma.sector.create({
      data: {
        eventId,
        name: "Pista Comum",
        type: "GENERAL_ADMISSION",
        price: 100.0,
        totalCapacity: 5,
        availableCapacity: 5,
      },
    });
    gaSectorId = gaSector.id;

    // 5. Create 10 Customer Users with sessions
    for (let i = 1; i <= 10; i++) {
      const customer = await prisma.user.create({
        data: {
          name: `Customer ${i} ${TEST_PREFIX}`,
          email: `${TEST_PREFIX}-cust${i}@example.com`,
          passwordHash: "hash123",
          role: "CUSTOMER",
        },
      });
      customerIds.push(customer.id);
      const token = await createSession({
        id: customer.id,
        email: customer.email,
        role: "CUSTOMER",
      });
      customerTokens.push(token);
    }
  });

  afterAll(async () => {
    if (!isDbAvailable) return;
    // Cleanup all created records
    try {
      if (eventId) {
        await prisma.event.delete({ where: { id: eventId } });
      }
      if (organizerId) {
        await prisma.user.delete({ where: { id: organizerId } });
      }
      for (const cid of customerIds) {
        await prisma.user.delete({ where: { id: cid } }).catch(() => {});
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  });

  beforeEach((ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    mockCookies.clear();
  });

  it("should prevent double-booking on numbered seats under 10 concurrent requests (exact 1 winner)", async () => {
    // We simulate 10 concurrent requests to reserve Seat A1
    const promises = customerTokens.map(async (token, index) => {
      // Set session for this request
      mockCookies.set("session", token);

      const req = new NextRequest("http://localhost:3000/api/seats/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `session=${token}`,
        },
        body: JSON.stringify({
          eventId,
          sectorId: numberedSectorId,
          seatIds: [seatA1Id],
        }),
      });

      const res = await reserveSeatsRoute(req);
      const status = res.status;
      const data = await res.json();
      return { status, data, index };
    });

    const results = await Promise.all(promises);

    const successful = results.filter((r) => r.status === 200);
    const conflicts = results.filter((r) => r.status === 409);

    // Exactly 1 winner, 9 conflicts
    expect(successful).toHaveLength(1);
    expect(conflicts).toHaveLength(9);

    expect(successful[0].data.success).toBe(true);
    expect(successful[0].data.reservationId).toBeDefined();

    for (const conflict of conflicts) {
      expect(conflict.data.error).toContain(
        "Um ou mais assentos selecionados já foram reservados"
      );
    }

    // Verify DB state
    const seatInDb = await prisma.seat.findUnique({ where: { id: seatA1Id } });
    expect(seatInDb?.status).toBe("RESERVED");
    expect(seatInDb?.reservedById).toBeDefined();

    const reservationsCount = await prisma.reservation.count({
      where: {
        eventId,
        items: {
          some: { seatId: seatA1Id },
        },
      },
    });
    expect(reservationsCount).toBe(1);
  });

  it("should prevent overbooking on general admission capacity under concurrent requests", async () => {
    // Sector capacity is 5.
    // 3 concurrent requests trying to buy 2 tickets each (total 6 > 5).
    // Exactly 2 must succeed (2 * 2 = 4 tickets, 1 remaining capacity), and 1 must fail with 409.

    const reqs = [0, 1, 2].map(async (i) => {
      const token = customerTokens[i];
      mockCookies.set("session", token);

      const req = new NextRequest(
        "http://localhost:3000/api/reservations/general-admission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: `session=${token}`,
          },
          body: JSON.stringify({
            sectorId: gaSectorId,
            quantity: 2,
          }),
        }
      );

      const res = await reserveGARoute(req);
      const status = res.status;
      const data = await res.json();
      return { status, data, i };
    });

    const results = await Promise.all(reqs);

    const successful = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successful).toHaveLength(2);
    expect(conflicts).toHaveLength(1);

    expect(conflicts[0].data.error).toContain("Vagas insuficientes no setor");

    // Verify DB state: availableCapacity should now be 5 - 4 = 1
    const sectorInDb = await prisma.sector.findUnique({
      where: { id: gaSectorId },
    });
    expect(sectorInDb?.availableCapacity).toBe(1);
  });
});
