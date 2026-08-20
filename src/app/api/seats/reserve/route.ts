import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reserveSeatsSchema } from "@/lib/validations/reservation";
import { publishSeatEvent } from "@/lib/seat-events";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          error: "Organizadores não podem comprar ingressos. Faça login como cliente.",
          code: "ORGANIZER_CANNOT_BUY",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = reserveSeatsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.format() }, { status: 400 });
    }

    const { eventId, sectorId, seatIds } = result.data;

    const reservation = await prisma.$transaction(async (tx) => {
      // 1. Busca o setor
      const sector = await tx.sector.findUnique({
        where: { id: sectorId },
      });

      if (!sector) {
        throw new Error("NOT_FOUND");
      }

      if (sector.type !== "NUMBERED_SEATS") {
        throw new Error("INVALID_TYPE");
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // 2. Lock atômico nos assentos
      const updateCount = await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          status: "AVAILABLE",
        },
        data: {
          status: "RESERVED",
          reservedById: session.id,
          reservedUntil: expiresAt,
        },
      });

      // Se não atualizou todos os assentos, aborta
      if (updateCount.count !== seatIds.length) {
        throw new Error("CONFLICT");
      }

      // 3. Cria a Reserva
      const res = await tx.reservation.create({
        data: {
          userId: session.id,
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
          items: {
            include: { seat: true },
          }
        },
      });

      return res;
    });

    // Dispara evento SSE em tempo real
    if (eventId) {
      publishSeatEvent(eventId, {
        type: "SEAT_STATUS_CHANGED",
        eventId,
        seats: reservation.items.map((i) => ({
          id: i.seatId!,
          status: "RESERVED",
          reservedUntil: reservation.expiresAt.toISOString(),
          reservedById: session.id,
          row: i.seat?.row,
          number: i.seat?.number,
        })),
      });
    }

    const totalPrice = reservation.items.reduce((acc, item) => acc + item.unitPrice, 0);

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        reservedSeats: reservation.items.map(item => `${item.seat?.row}${item.seat?.number}`),
        totalPrice,
        reservedUntil: reservation.expiresAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[RESERVE_SEATS_ERROR]", error);

    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
    }
    if (error.message === "INVALID_TYPE") {
      return NextResponse.json({ error: "Setor não é de assentos numerados" }, { status: 400 });
    }
    if (error.message === "CONFLICT") {
      return NextResponse.json({ error: "Um ou mais assentos selecionados já foram reservados por outro cliente." }, { status: 409 });
    }

    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
