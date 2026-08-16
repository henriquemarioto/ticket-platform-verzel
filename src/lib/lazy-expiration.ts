import { prisma } from "@/lib/prisma";

export async function releaseExpiredReservations(eventId?: string) {
  const now = new Date();

  // 1. Libera assentos numerados
  await prisma.seat.updateMany({
    where: {
      status: "RESERVED",
      reservedUntil: { lt: now },
      ...(eventId ? { sector: { eventId } } : {})
    },
    data: {
      status: "AVAILABLE",
      reservedById: null,
      reservedUntil: null,
    },
  });

  // 2. Lidar com as Reservas do tipo Pista (General Admission)
  // Como a modelagem decreta capacity no update, ao expirar precisamos devolver o capacity.
  // Buscamos as reservas PENDING expiradas
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      ...(eventId ? { eventId } : {})
    },
    include: { items: true },
  });

  if (expiredReservations.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const res of expiredReservations) {
        // Marca como cancelada/expirada
        await tx.reservation.update({
          where: { id: res.id },
          data: { status: "EXPIRED" },
        });

        // Devolve capacidade (apenas para GENERAL_ADMISSION, onde seatId é nulo)
        for (const item of res.items) {
          if (!item.seatId) {
            await tx.sector.update({
              where: { id: item.sectorId },
              data: { availableCapacity: { increment: item.quantity } },
            });
          }
        }
      }
    });
  }
}
