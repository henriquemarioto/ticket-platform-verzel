import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateSecureTicketCode, generateTicketQRPayload } from "@/lib/crypto";
import { broadcastReservationEffects } from "@/lib/seat-events";
import { ServiceError } from "./errors";
import crypto from "crypto";

export interface ProcessCheckoutInput {
  reservationId: string;
  action: "APPROVE" | "REJECT";
  paymentMethod: string;
  reason?: string;
  customerId: string;
}

export async function validateReservationForCheckout(reservationId: string, customerId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      items: {
        include: {
          seat: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new ServiceError("Reserva não encontrada", 404);
  }

  if (reservation.userId !== customerId) {
    throw new ServiceError("Acesso negado", 403);
  }

  if (reservation.status !== "PENDING") {
    throw new ServiceError("Reserva já foi processada ou cancelada", 400);
  }

  if (reservation.expiresAt < new Date()) {
    throw new ServiceError("A reserva expirou", 410);
  }

  return reservation;
}

async function closeEventIfSoldOut(tx: Prisma.TransactionClient, eventId: string): Promise<void> {
  const eventSectors = await tx.sector.findMany({
    where: { eventId },
    select: { id: true, type: true, totalCapacity: true },
  });

  if (eventSectors.length === 0) return;

  for (const sector of eventSectors) {
    if (sector.type === "GENERAL_ADMISSION") {
      const activeCount = await tx.ticket.count({
        where: { sectorId: sector.id, status: { in: ["ACTIVE", "USED"] } },
      });
      if (activeCount < sector.totalCapacity) return;
    } else {
      const nonSold = await tx.seat.count({
        where: { sectorId: sector.id, status: { not: "SOLD" } },
      });
      if (nonSold > 0) return;
    }
  }

  const currentEvent = await tx.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });

  if (currentEvent?.status === "PUBLISHED") {
    await tx.event.update({
      where: { id: eventId },
      data: { status: "CLOSED" },
    });
  }
}

export async function processCheckout(input: ProcessCheckoutInput) {
  const { reservationId, action, paymentMethod, reason, customerId } = input;
  const reservation = await validateReservationForCheckout(reservationId, customerId);

  const totalAmount = reservation.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const result = await prisma.$transaction(async (tx) => {
    if (action === "APPROVE") {
      const order = await tx.order.create({
        data: {
          customerId,
          reservationId: reservation.id,
          totalAmount,
          status: "APPROVED",
          paymentMethod,
        },
      });

      const createdTickets = [];

      for (const item of reservation.items) {
        if (item.seatId) {
          await tx.seat.update({
            where: { id: item.seatId },
            data: { status: "SOLD" },
          });
        }

        for (let i = 0; i < item.quantity; i++) {
          const ticketCode = generateSecureTicketCode();
          const shareToken = crypto.randomUUID();
          const timestamp = Math.floor(Date.now() / 1000);
          const { secureToken, qrPayload } = generateTicketQRPayload(ticketCode, reservation.eventId, timestamp);

          const ticket = await tx.ticket.create({
            data: {
              orderId: order.id,
              eventId: reservation.eventId,
              sectorId: item.sectorId,
              seatId: item.seatId,
              customerId,
              ticketCode,
              qrPayload,
              secureToken,
              shareToken,
              status: "ACTIVE",
            },
            include: {
              sector: true,
              seat: true,
            },
          });

          createdTickets.push({
            id: ticket.id,
            ticketCode: ticket.ticketCode,
            seatNumber: ticket.seat?.row && ticket.seat?.number ? `${ticket.seat.row}${ticket.seat.number}` : undefined,
            sectorName: ticket.sector.name,
            status: ticket.status,
          });
        }
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "COMPLETED" },
      });

      await closeEventIfSoldOut(tx, reservation.eventId);

      return {
        status: "APPROVED",
        orderId: order.id,
        totalPaid: totalAmount,
        tickets: createdTickets,
      };
    } else {
      // REJECT
      const order = await tx.order.create({
        data: {
          customerId,
          reservationId: reservation.id,
          totalAmount,
          status: "REJECTED",
          paymentMethod,
          paymentDetails: reason || "Pagamento recusado pela operadora do cartão",
        },
      });

      for (const item of reservation.items) {
        if (item.seatId) {
          await tx.seat.update({
            where: { id: item.seatId },
            data: {
              status: "AVAILABLE",
              reservedById: null,
              reservedUntil: null,
            },
          });
        } else {
          await tx.sector.update({
            where: { id: item.sectorId },
            data: { availableCapacity: { increment: item.quantity } },
          });
        }
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "CANCELLED" },
      });

      return {
        status: "REJECTED",
        orderId: order.id,
        error: reason || "Pagamento recusado pela operadora do cartão.",
      };
    }
  });

  // Emissão única e centralizada de SSE eliminando blocos repetidos
  await broadcastReservationEffects({
    eventId: reservation.eventId,
    items: reservation.items,
    seatStatus: action === "APPROVE" ? "SOLD" : "AVAILABLE",
    reservedUntil: null,
    reservedById: null,
    fetchSectorCapacity: async (sectorId: string) => {
      const s = await prisma.sector.findUnique({
        where: { id: sectorId },
        select: { availableCapacity: true },
      });
      return s?.availableCapacity ?? null;
    },
  });

  return { success: action === "APPROVE", ...result };
}
