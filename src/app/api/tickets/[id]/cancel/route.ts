import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { publishSeatEvent } from "@/lib/seat-events";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Apenas clientes podem cancelar ingressos" }, { status: 403 });
    }

    const { id: ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json({ error: "ID do ingresso não informado" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        sector: true,
        seat: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ingresso não encontrado" }, { status: 404 });
    }

    if (ticket.customerId !== session.id) {
      return NextResponse.json({ error: "Você não tem permissão para cancelar este ingresso" }, { status: 403 });
    }

    if (ticket.status !== "ACTIVE") {
      const msg =
        ticket.status === "USED"
          ? "Não é possível cancelar um ingresso que já foi utilizado."
          : "Este ingresso já se encontra cancelado.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (new Date(ticket.event.eventDate) <= new Date()) {
      return NextResponse.json(
        { error: "Não é possível cancelar ingressos de eventos que já ocorreram ou estão em andamento." },
        { status: 400 }
      );
    }

    const { updatedSector } = await prisma.$transaction(async (tx) => {
      // 1. Atualiza o status do ticket atomicamente
      const updateResult = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          status: "ACTIVE",
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (updateResult.count === 0) {
        throw new Error("CONFLICT");
      }

      let updatedSectorData = null;

      // 2. Libera assento ou devolve capacidade do setor
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
          data: {
            availableCapacity: { increment: 1 },
          },
        });
      }

      // 3. Se o evento estava esgotado/fechado, reabre para publicado
      if (ticket.event.status === "CLOSED") {
        await tx.event.update({
          where: { id: ticket.eventId },
          data: { status: "PUBLISHED" },
        });
      }

      return { updatedSector: updatedSectorData };
    });

    // 4. Publica evento SSE em tempo real
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

    const cancelledAt = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        ticketId: ticket.id,
        status: "CANCELLED",
        seatRestored: ticket.seat ? `${ticket.seat.row.toUpperCase()}${ticket.seat.number}` : null,
        refundAmount: ticket.sector.price,
        cancelledAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CANCEL_TICKET_ERROR]", error);

    if (error.message === "CONFLICT") {
      return NextResponse.json(
        { error: "O ingresso já foi alterado ou cancelado concorrentemente." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Erro interno no servidor ao cancelar ingresso" }, { status: 500 });
  }
}
