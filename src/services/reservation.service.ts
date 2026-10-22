import { prisma } from "@/lib/prisma";
import { publishSeatEvent } from "@/lib/seat-events";
import { ServiceError } from "./errors";

export async function reserveGeneralAdmission(input: {
  userId: string;
  sectorId: string;
  quantity: number;
}) {
  const { userId, sectorId, quantity } = input;

  const reservation = await prisma.$transaction(async (tx) => {
    const sector = await tx.sector.findUnique({ where: { id: sectorId } });
    if (!sector) throw new ServiceError("Setor não encontrado", 404);
    if (sector.type !== "GENERAL_ADMISSION") {
      throw new ServiceError("Setor não é de pista (General Admission)", 400);
    }

    // Decremento atômico condicional anti-overselling
    const updateResult = await tx.$executeRaw`
      UPDATE "sectors"
      SET "availableCapacity" = "availableCapacity" - ${quantity}
      WHERE id = ${sectorId} AND "availableCapacity" >= ${quantity}
    `;

    if (updateResult === 0) {
      throw new ServiceError("Vagas insuficientes no setor para a quantidade solicitada.", 409);
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return tx.reservation.create({
      data: {
        userId,
        eventId: sector.eventId,
        status: "PENDING",
        expiresAt,
        items: {
          create: {
            sectorId: sector.id,
            quantity,
            unitPrice: sector.price,
          },
        },
      },
      include: { items: true },
    });
  });

  const item = reservation.items[0];
  return {
    id: reservation.id,
    sectorId,
    quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.unitPrice * quantity,
    expiresAt: reservation.expiresAt,
  };
}

export async function reserveNumberedSeats(input: {
  userId: string;
  eventId: string;
  sectorId: string;
  seatIds: string[];
}) {
  const { userId, eventId, sectorId, seatIds } = input;

  const reservation = await prisma.$transaction(async (tx) => {
    const sector = await tx.sector.findUnique({ where: { id: sectorId } });
    if (!sector) throw new ServiceError("Setor não encontrado", 404);
    if (sector.type !== "NUMBERED_SEATS") {
      throw new ServiceError("Setor não é de assentos numerados", 400);
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Lock atômico condicional nos assentos
    const updateCount = await tx.seat.updateMany({
      where: {
        id: { in: seatIds },
        status: "AVAILABLE",
      },
      data: {
        status: "RESERVED",
        reservedById: userId,
        reservedUntil: expiresAt,
      },
    });

    if (updateCount.count !== seatIds.length) {
      throw new ServiceError(
        "Um ou mais assentos selecionados já foram reservados por outro cliente.",
        409
      );
    }

    return tx.reservation.create({
      data: {
        userId,
        eventId,
        status: "PENDING",
        expiresAt,
        items: {
          create: seatIds.map((seatId) => ({
            sectorId,
            seatId,
            quantity: 1,
            unitPrice: sector.price,
          })),
        },
      },
      include: {
        items: { include: { seat: true } },
      },
    });
  });

  if (eventId) {
    publishSeatEvent(eventId, {
      type: "SEAT_STATUS_CHANGED",
      eventId,
      seats: reservation.items.map((i) => ({
        id: i.seatId!,
        status: "RESERVED",
        reservedUntil: reservation.expiresAt.toISOString(),
        reservedById: userId,
        row: i.seat?.row,
        number: i.seat?.number,
      })),
    });
  }

  const totalPrice = reservation.items.reduce((acc, item) => acc + item.unitPrice, 0);

  return {
    reservationId: reservation.id,
    reservedSeats: reservation.items.map((item) => `${item.seat?.row}${item.seat?.number}`),
    totalPrice,
    reservedUntil: reservation.expiresAt,
  };
}
