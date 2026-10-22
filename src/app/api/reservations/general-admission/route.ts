import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reserveGeneralAdmissionSchema } from "@/lib/validations/reservation";
import { reserveGeneralAdmission } from "@/services/reservation.service";
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
    const result = reserveGeneralAdmissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.format() }, { status: 400 });
    }

    const reservation = await reserveGeneralAdmission({
      userId: session.id,
      sectorId: result.data.sectorId,
      quantity: result.data.quantity,
    });

    return NextResponse.json(
      {
        success: true,
        reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "ReserveGeneralAdmissionRoute", "Erro interno no servidor ao reservar pista");
  }
}
