import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { removeEventGatekeeper } from "@/services/event.service";
import { handleApiError } from "@/services/errors";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; gatekeeperId: string }> }
) {
  try {
    const session = await getSession();
    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");

    const userId = session?.id || userIdHeader;
    const userRole = session?.role || roleHeader;

    if (!userId || userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas organizadores podem remover portaria." },
        { status: 403 }
      );
    }

    const { id: eventId, gatekeeperId } = await params;

    const result = await removeEventGatekeeper(userId, eventId, gatekeeperId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "RemoveEventGatekeeperRoute", "Erro interno no servidor ao desvincular operador de portaria.");
  }
}
