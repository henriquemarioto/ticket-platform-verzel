import { prisma } from "@/lib/prisma";
import { publishSeatEvent } from "@/lib/seat-events";

export async function releaseExpiredReservations(eventId?: string) {
  const now = new Date();

  // 1. Libera assentos numerados
  const expiredSeats = await prisma.seat.findMany({
    where: {
      status: "RESERVED",
      reservedUntil: { lt: now },
      ...(eventId ? { sector: { eventId } } : {}),
    },
    include: {
      sector: {
        select: { eventId: true },
      },
    },
  });

  if (expiredSeats.length > 0) {
    const seatIds = expiredSeats.map((s) => s.id);
    await prisma.seat.updateMany({
      where: {
        id: { in: seatIds },
      },
      data: {
        status: "AVAILABLE",
        reservedById: null,
        reservedUntil: null,
      },
    });

    // Agrupa assentos por eventId e emite evento SSE
    const seatsByEvent = new Map<string, typeof expiredSeats>();
    for (const seat of expiredSeats) {
      const eId = seat.sector.eventId;
      if (!seatsByEvent.has(eId)) {
        seatsByEvent.set(eId, []);
      }
      seatsByEvent.get(eId)!.push(seat);
    }

    for (const [eId, seats] of seatsByEvent.entries()) {
      publishSeatEvent(eId, {
        type: "SEAT_STATUS_CHANGED",
        eventId: eId,
        seats: seats.map((s) => ({
          id: s.id,
          status: "AVAILABLE",
          reservedUntil: null,
          reservedById: null,
          row: s.row,
          number: s.number,
        })),
      });
    }
  }

  // 2. Lidar com as Reservas do tipo Pista (General Admission)
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      ...(eventId ? { eventId } : {}),
    },
    include: { items: true },
  });

  if (expiredReservations.length > 0) {
    const updatedSectors: Array<{ eventId: string; sectorId: string; availableCapacity: number }> = [];

    await prisma.$transaction(async (tx) => {
      for (const res of expiredReservations) {
        await tx.reservation.update({
          where: { id: res.id },
          data: { status: "EXPIRED" },
        });

        // Devolve capacidade (apenas para GENERAL_ADMISSION, onde seatId é nulo)
        for (const item of res.items) {
          if (!item.seatId) {
            const updated = await tx.sector.update({
              where: { id: item.sectorId },
              data: { availableCapacity: { increment: item.quantity } },
            });
            updatedSectors.push({
              eventId: res.eventId,
              sectorId: item.sectorId,
              availableCapacity: updated.availableCapacity,
            });
          }
        }
      }
    });

    for (const s of updatedSectors) {
      publishSeatEvent(s.eventId, {
        type: "SECTOR_CAPACITY_CHANGED",
        eventId: s.eventId,
        sectorId: s.sectorId,
        availableCapacity: s.availableCapacity,
      });
    }
  }
}
