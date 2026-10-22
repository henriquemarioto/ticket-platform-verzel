import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reserveSeatsSchema } from "@/lib/validations/reservation";
import { reserveNumberedSeats } from "@/services/reservation.service";
import { handleApiError } from "@/services/errors";

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

    const reservationData = await reserveNumberedSeats({
      userId: session.id,
      eventId,
      sectorId,
      seatIds,
    });

    return NextResponse.json(
      {
        success: true,
        ...reservationData,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "ReserveNumberedSeatsRoute", "Erro interno no servidor ao reservar assentos");
  }
}
