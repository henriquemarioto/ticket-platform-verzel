import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reservationId, action, paymentMethod, reason } = parsed.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        items: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    }

    if (reservation.userId !== session.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json({ error: "Reserva já foi processada ou cancelada" }, { status: 400 });
    }

    if (reservation.expiresAt < new Date()) {
      return NextResponse.json({ error: "A reserva expirou" }, { status: 410 });
    }

    // Calcular totalAmount
    const totalAmount = reservation.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    const result = await prisma.$transaction(async (tx) => {
      if (action === "APPROVE") {
        const order = await tx.order.create({
          data: {
            customerId: session.id,
            reservationId: reservation.id,
            totalAmount,
            status: "APPROVED",
            paymentMethod,
          },
        });

        const createdTickets = [];

        for (const item of reservation.items) {
          if (item.seatId) {
            // Update seat status
            await tx.seat.update({
              where: { id: item.seatId },
              data: {
                status: "SOLD",
              },
            });
          }

          // Create ticket
          for (let i = 0; i < item.quantity; i++) {
            const ticketCode = `ELT-${Math.floor(1000 + Math.random() * 9000)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
            const shareToken = crypto.randomUUID();
            const secureToken = crypto.randomBytes(16).toString("hex");
            const qrPayload = `v1:${ticketCode}:${reservation.eventId}:${Math.floor(Date.now() / 1000)}:${secureToken}`;

            const ticket = await tx.ticket.create({
              data: {
                orderId: order.id,
                eventId: reservation.eventId,
                sectorId: item.sectorId,
                seatId: item.seatId,
                customerId: session.id,
                ticketCode,
                qrPayload,
                secureToken,
                shareToken,
                status: "ACTIVE",
              },
              include: {
                sector: true,
                seat: true,
              }
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
            customerId: session.id,
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
            // General Admission
            await tx.sector.update({
              where: { id: item.sectorId },
              data: {
                availableCapacity: { increment: item.quantity },
              },
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

    return NextResponse.json({ success: action === "APPROVE", ...result });
  } catch (error) {
    console.error("Checkout process error:", error);
    return NextResponse.json({ error: "Erro ao processar o checkout" }, { status: 500 });
  }
}
