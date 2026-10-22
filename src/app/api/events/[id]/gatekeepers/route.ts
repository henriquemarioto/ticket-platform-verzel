import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTemporaryGatekeeperSchema } from "@/lib/validations/gatekeeper-management";
import { listEventGatekeepers, assignEventGatekeeper } from "@/services/event.service";
import { handleApiError } from "@/services/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");

    const userId = session?.id || userIdHeader;
    const userRole = session?.role || roleHeader;

    if (!userId || userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas organizadores podem gerenciar portaria." },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const gatekeepers = await listEventGatekeepers(userId, eventId);

    return NextResponse.json({
      success: true,
      gatekeepers,
    });
  } catch (error) {
    return handleApiError(error, "ListEventGatekeepersRoute", "Erro interno no servidor ao listar portaria.");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");

    const userId = session?.id || userIdHeader;
    const userRole = session?.role || roleHeader;

    if (!userId || userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas organizadores podem criar contas de portaria." },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const validation = createTemporaryGatekeeperSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const gatekeeper = await assignEventGatekeeper(userId, eventId, validation.data);

    return NextResponse.json(
      {
        success: true,
        gatekeeper,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "AssignEventGatekeeperRoute", "Erro interno no servidor ao criar conta de portaria.");
  }
}
