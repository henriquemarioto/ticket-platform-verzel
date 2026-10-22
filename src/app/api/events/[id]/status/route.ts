import { NextRequest, NextResponse } from "next/server";
import { updateEventStatusSchema } from "@/lib/validations/events";
import { updateEventStatus } from "@/services/event.service";
import { handleApiError } from "@/services/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    if (role !== "ORGANIZER" || !userId) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas organizadores podem alterar o status de eventos." },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const result = updateEventStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const updatedEvent = await updateEventStatus(userId, eventId, result.data.status);

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    return handleApiError(error, "UpdateEventStatusRoute", "Erro interno ao atualizar status do evento");
  }
}
