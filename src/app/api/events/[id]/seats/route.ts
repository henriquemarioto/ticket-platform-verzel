import { NextRequest, NextResponse } from "next/server";
import { getEventSeatsWithExpiration } from "@/services/event.service";
import { handleApiError } from "@/services/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: "ID do evento não informado" }, { status: 400 });
    }

    const sectors = await getEventSeatsWithExpiration(eventId);

    return NextResponse.json({
      success: true,
      sectors,
    });
  } catch (error) {
    return handleApiError(error, "GetEventSeatsRoute", "Erro ao carregar mapa de assentos");
  }
}
