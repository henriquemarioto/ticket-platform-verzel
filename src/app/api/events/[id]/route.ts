import { NextRequest, NextResponse } from "next/server";
import { updateEventSchema } from "@/lib/validations/events";
import { getEventById, updateEvent } from "@/services/event.service";
import { handleApiError } from "@/services/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID do evento não fornecido." }, { status: 400 });
    }

    const event = await getEventById(id);

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    return handleApiError(error, "GetEventRoute", "Erro interno no servidor ao buscar evento.");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas organizadores podem editar eventos." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID do evento não fornecido." }, { status: 400 });
    }

    const body = await req.json();
    const validation = updateEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados de evento inválidos.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updatedEvent = await updateEvent(userId, id, validation.data);

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    return handleApiError(error, "UpdateEventRoute", "Erro interno no servidor ao atualizar evento.");
  }
}
