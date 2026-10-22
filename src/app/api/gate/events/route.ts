import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listAuthorizedGatekeeperEvents } from "@/services/gate.service";
import { handleApiError } from "@/services/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const roleHeader = request.headers.get("x-user-role");
    const userIdHeader = request.headers.get("x-user-id");
    const userId = session?.id || userIdHeader;
    const userRole = session?.role || roleHeader;

    if (!userRole || !userId) {
      return NextResponse.json(
        { error: "Não autorizado. Sessão necessária." },
        { status: 401 }
      );
    }

    if (userRole !== "GATEKEEPER") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas operadores de portaria podem acessar esta rota." },
        { status: 403 }
      );
    }

    const events = await listAuthorizedGatekeeperEvents(userId);

    return NextResponse.json(
      {
        success: true,
        serverTime: new Date().toISOString(),
        events,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "GateEventsRoute", "Erro interno ao carregar eventos da portaria");
  }
}
