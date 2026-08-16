import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateEventStatusSchema } from "@/lib/validations/events";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Não autorizado", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "ID do evento não fornecido", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateEventStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          code: "VALIDATION_ERROR",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para gerenciar este evento.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("[EVENT_STATUS_PATCH]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
