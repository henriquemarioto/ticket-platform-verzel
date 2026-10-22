import { prisma } from "@/lib/prisma";
import { publishSeatEvent } from "@/lib/seat-events";
import { generateSharePasscode } from "@/lib/crypto";
import { ServiceError } from "./errors";

export async function cancelCustomerTicket(userId: string, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: true,
      sector: true,
      seat: true,
    },
  });

  if (!ticket) throw new ServiceError("Ingresso não encontrado", 404);
  if (ticket.customerId !== userId) {
    throw new ServiceError("Você não tem permissão para cancelar este ingresso", 403);
  }

  if (ticket.status !== "ACTIVE") {
    const msg =
      ticket.status === "USED"
        ? "Não é possível cancelar um ingresso que já foi utilizado."
        : "Este ingresso já se encontra cancelado.";
    throw new ServiceError(msg, 400);
  }

  if (new Date(ticket.event.eventDate) <= new Date()) {
    throw new ServiceError(
      "Não é possível cancelar ingressos de eventos que já ocorreram ou estão em andamento.",
      400
    );
  }

  const { updatedSector } = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.ticket.updateMany({
      where: { id: ticket.id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    if (updateResult.count === 0) {
      throw new ServiceError("O ingresso já foi alterado ou cancelado concorrentemente.", 409);
    }

    let updatedSectorData = null;

    if (ticket.seatId) {
      await tx.seat.update({
        where: { id: ticket.seatId },
        data: {
          status: "AVAILABLE",
          reservedById: null,
          reservedUntil: null,
        },
      });
    } else {
      updatedSectorData = await tx.sector.update({
        where: { id: ticket.sectorId },
        data: { availableCapacity: { increment: 1 } },
      });
    }

    if (ticket.event.status === "CLOSED") {
      await tx.event.update({
        where: { id: ticket.eventId },
        data: { status: "PUBLISHED" },
      });
    }

    return { updatedSector: updatedSectorData };
  });

  if (ticket.seat) {
    publishSeatEvent(ticket.eventId, {
      type: "SEAT_STATUS_CHANGED",
      eventId: ticket.eventId,
      seats: [
        {
          id: ticket.seat.id,
          status: "AVAILABLE",
          reservedUntil: null,
          reservedById: null,
          row: ticket.seat.row,
          number: ticket.seat.number,
        },
      ],
    });
  } else if (updatedSector) {
    publishSeatEvent(ticket.eventId, {
      type: "SECTOR_CAPACITY_CHANGED",
      eventId: ticket.eventId,
      sectorId: ticket.sectorId,
      availableCapacity: updatedSector.availableCapacity,
    });
  }

  return {
    ticketId: ticket.id,
    status: "CANCELLED",
    seatRestored: ticket.seat ? `${ticket.seat.row.toUpperCase()}${ticket.seat.number}` : null,
    refundAmount: ticket.sector.price,
    cancelledAt: new Date().toISOString(),
  };
}

export async function createTicketShareLink(userId: string, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, customerId: true, shareToken: true, status: true },
  });

  if (!ticket) throw new ServiceError("Ingresso não encontrado", 404);
  if (ticket.customerId !== userId) throw new ServiceError("Acesso negado", 403);

  const passcode = generateSharePasscode(ticket.shareToken);
  const shareUrl = `/tickets/share/${ticket.shareToken}?key=${passcode}`;

  return { shareToken: ticket.shareToken, shareUrl };
}

export async function listCustomerTickets(userId: string) {
  const tickets = await prisma.ticket.findMany({
    where: { customerId: userId },
    include: {
      event: true,
      sector: true,
      seat: true,
    },
    orderBy: { event: { eventDate: "asc" } },
  });

  const now = new Date();
  const upcomingTickets = tickets.filter(
    (t) => t.status === "ACTIVE" && new Date(t.event.eventDate) > now
  );
  const pastTickets = tickets.filter(
    (t) => t.status !== "ACTIVE" || new Date(t.event.eventDate) <= now
  );

  return { upcomingTickets, pastTickets };
}
