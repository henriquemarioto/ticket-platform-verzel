import { NextRequest, NextResponse } from "next/server";
import { getOrganizerAnalytics } from "@/services/event.service";
import { handleApiError } from "@/services/errors";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id");

    if (role !== "ORGANIZER" || !userId) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas organizadores podem visualizar métricas." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const eventId = searchParams.get("eventId");

    const analytics = await getOrganizerAnalytics(userId, eventId);

    return NextResponse.json(analytics);
  } catch (error) {
    return handleApiError(error, "OrganizerAnalyticsRoute", "Erro interno no servidor ao carregar analytics.");
  }
}
