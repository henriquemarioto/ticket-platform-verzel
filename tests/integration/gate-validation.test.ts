import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as validateRoute } from "@/app/api/gate/validate/route";
import { generateTicketQRPayload } from "@/lib/crypto";
import { createSession } from "@/lib/auth";
import { mockCookies } from "../setup";

describe("Gatekeeper Validation Integration & Concurrency Tests (UC19, UC20, UC30)", () => {
  let isDbAvailable = false;
  const TEST_PREFIX = `test-gate-${Date.now()}`;
  let organizerId: string;
  let gatekeeperId: string;
  let unauthorizedGatekeeperId: string;
  let customerId: string;
  let eventId: string;
  let otherEventId: string;
  let sectorId: string;
  let gatekeeperToken: string;
  let unauthorizedGatekeeperToken: string;

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
    const org = await prisma.user.create({
      data: {
        name: "Gate Org",
        email: `${TEST_PREFIX}-org@example.com`,
        passwordHash: "hash",
        role: "ORGANIZER",
      },
    });
    organizerId = org.id;

    // 2. Create Gatekeeper
    const gatekeeper = await prisma.user.create({
      data: {
        name: "Gatekeeper Op 1",
        email: `${TEST_PREFIX}-gate1@example.com`,
        passwordHash: "hash",
        role: "GATEKEEPER",
      },
    });
    gatekeeperId = gatekeeper.id;
    gatekeeperToken = await createSession({
      id: gatekeeper.id,
      email: gatekeeper.email,
      role: "GATEKEEPER",
    });

    // 3. Create Unauthorized Gatekeeper
    const unauthGate = await prisma.user.create({
      data: {
        name: "Gatekeeper Unauth",
        email: `${TEST_PREFIX}-gate2@example.com`,
        passwordHash: "hash",
        role: "GATEKEEPER",
      },
    });
    unauthorizedGatekeeperId = unauthGate.id;
    unauthorizedGatekeeperToken = await createSession({
      id: unauthGate.id,
      email: unauthGate.email,
      role: "GATEKEEPER",
    });

    // 4. Create Customer
    const customer = await prisma.user.create({
      data: {
        name: "Gate Customer",
        email: `${TEST_PREFIX}-cust@example.com`,
        passwordHash: "hash",
        role: "CUSTOMER",
      },
    });
    customerId = customer.id;

    // 5. Create Main Event (Gates opened 1h ago, finishes in 4h)
    const now = Date.now();
    const event = await prisma.event.create({
      data: {
        title: `${TEST_PREFIX} Gate Main Event`,
        description: "A".repeat(300),
        category: "SHOW",
        bannerUrl: "https://example.com/banner.jpg",
        locationName: "Espaço Portaria",
        city: "São Paulo, SP",
        eventDate: new Date(now + 2 * 60 * 60 * 1000), // starts in 2h
        entryStartTime: new Date(now - 1 * 60 * 60 * 1000), // opened 1h ago
        endDate: new Date(now + 6 * 60 * 60 * 1000), // ends in 6h
        organizerId,
      },
    });
    eventId = event.id;

    // Link Gatekeeper to Main Event
    await prisma.eventGatekeeper.create({
      data: {
        eventId,
        gatekeeperId,
      },
    });

    // 6. Create Another Event (to test WRONG_EVENT)
    const otherEvent = await prisma.event.create({
      data: {
        title: `${TEST_PREFIX} Other Event`,
        description: "B".repeat(300),
        category: "THEATER",
        bannerUrl: "https://example.com/other.jpg",
        locationName: "Teatro Municipal",
        city: "São Paulo, SP",
        eventDate: new Date(now + 5 * 60 * 60 * 1000),
        entryStartTime: new Date(now - 30 * 60 * 1000),
        endDate: new Date(now + 8 * 60 * 60 * 1000),
        organizerId,
      },
    });
    otherEventId = otherEvent.id;

    // 7. Create Sector for Main Event
    const sector = await prisma.sector.create({
      data: {
        eventId,
        name: "Pista Premium",
        type: "GENERAL_ADMISSION",
        price: 150.0,
        totalCapacity: 100,
        availableCapacity: 100,
      },
    });
    sectorId = sector.id;
  });

  afterAll(async () => {
    if (!isDbAvailable) return;
    try {
      if (eventId) {
        await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
      }
      if (otherEventId) {
        await prisma.event.delete({ where: { id: otherEventId } }).catch(() => {});
      }
      if (organizerId) {
        await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
      }
      if (gatekeeperId) {
        await prisma.user.delete({ where: { id: gatekeeperId } }).catch(() => {});
      }
      if (unauthorizedGatekeeperId) {
        await prisma.user.delete({ where: { id: unauthorizedGatekeeperId } }).catch(() => {});
      }
      if (customerId) {
        await prisma.user.delete({ where: { id: customerId } }).catch(() => {});
      }
    } catch (err) {
      console.error("Gate test cleanup error:", err);
    }
  });

  beforeEach((ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    mockCookies.clear();
  });

  const createTestTicket = async (targetEventId: string, status: "ACTIVE" | "USED" | "CANCELLED" = "ACTIVE") => {
    const ticketCode = `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const { qrPayload, secureToken } = generateTicketQRPayload(ticketCode, targetEventId, timestamp);
    const shareToken = `share-${ticketCode}`;

    const order = await prisma.order.create({
      data: {
        customerId,
        totalAmount: 150.0,
        status: "APPROVED",
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        orderId: order.id,
        eventId: targetEventId,
        sectorId,
        customerId,
        ticketCode,
        qrPayload,
        secureToken,
        shareToken,
        status,
        usedAt: status === "USED" ? new Date() : null,
      },
    });

    return { ticket, qrPayload, ticketCode };
  };

  it("should validate an active ticket for the first time (Result: VALID)", async () => {
    const { qrPayload, ticketCode } = await createTestTicket(eventId, "ACTIVE");
    mockCookies.set("session", gatekeeperToken);

    const req = new Request("http://localhost:3000/api/gate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        qrPayload,
      }),
    });

    const res = await validateRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.result).toBe("VALID");
    expect(body.message).toBe("Acesso Liberado");
    expect(body.ticket.code).toBe(ticketCode);

    // Verify DB updated
    const updatedTicket = await prisma.ticket.findUnique({
      where: { ticketCode },
    });
    expect(updatedTicket?.status).toBe("USED");
    expect(updatedTicket?.usedAt).toBeDefined();

    // Verify validation log
    const log = await prisma.ticketValidationLog.findFirst({
      where: { ticketId: updatedTicket?.id },
      orderBy: { validatedAt: "desc" },
    });
    expect(log?.result).toBe("VALID");
  });

  it("should reject an already used ticket (Result: ALREADY_USED)", async () => {
    const { qrPayload } = await createTestTicket(eventId, "USED");
    mockCookies.set("session", gatekeeperToken);

    const req = new Request("http://localhost:3000/api/gate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        qrPayload,
      }),
    });

    const res = await validateRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.result).toBe("ALREADY_USED");
    expect(body.message).toBe("Ingresso Já Utilizado");
  });

  it("should reject a ticket belonging to another event (Result: WRONG_EVENT)", async () => {
    // Ticket created for otherEventId
    const { qrPayload } = await createTestTicket(otherEventId, "ACTIVE");
    mockCookies.set("session", gatekeeperToken);

    const req = new Request("http://localhost:3000/api/gate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId, // Validating on main event
        qrPayload,
      }),
    });

    const res = await validateRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.result).toBe("WRONG_EVENT");
    expect(body.message).toBe("Evento Incorreto");
  });

  it("should reject forged HMAC signatures (Result: INVALID_CODE)", async () => {
    mockCookies.set("session", gatekeeperToken);
    const forgedQR = `v1:TCK-FAKE:${eventId}:1700000000:0123456789abcdef0123456789abcdef`;

    const req = new Request("http://localhost:3000/api/gate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        qrPayload: forgedQR,
      }),
    });

    const res = await validateRoute(req);
    const body = await res.json();
    expect(body.result).toBe("INVALID_CODE");
    expect(body.message).toBe("Código Inválido ou HMAC Forjado");
  });

  it("should reject cancelled tickets (Result: INVALID_CODE)", async () => {
    const { qrPayload } = await createTestTicket(eventId, "CANCELLED");
    mockCookies.set("session", gatekeeperToken);

    const req = new Request("http://localhost:3000/api/gate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        qrPayload,
      }),
    });

    const res = await validateRoute(req);
    const body = await res.json();
    expect(body.result).toBe("INVALID_CODE");
    expect(body.message).toBe("Ingresso Cancelado");
  });

  it("should block gatekeepers not assigned to the event", async () => {
    const { qrPayload } = await createTestTicket(eventId, "ACTIVE");
    mockCookies.set("session", unauthorizedGatekeeperToken);

    const req = new Request("http://localhost:3000/api/gate/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        qrPayload,
      }),
    });

    const res = await validateRoute(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.result).toBe("INVALID_CODE");
    expect(body.error).toContain("não está autorizado");
  });

  it("should handle simultaneous validation attempts for the same ticket (exact 1 VALID, 1 ALREADY_USED)", async () => {
    const { qrPayload } = await createTestTicket(eventId, "ACTIVE");

    // Two parallel requests
    const promises = [1, 2].map(async () => {
      mockCookies.set("session", gatekeeperToken);
      const req = new Request("http://localhost:3000/api/gate/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          qrPayload,
        }),
      });
      const res = await validateRoute(req);
      const data = await res.json();
      return { status: res.status, data };
    });

    const results = await Promise.all(promises);

    const valids = results.filter((r) => r.data.result === "VALID");
    const alreadyUseds = results.filter((r) => r.data.result === "ALREADY_USED");

    expect(valids).toHaveLength(1);
    expect(alreadyUseds).toHaveLength(1);
    expect(valids[0].data.message).toBe("Acesso Liberado");
    expect(alreadyUseds[0].data.message).toBe("Ingresso Já Utilizado");
  });
});
