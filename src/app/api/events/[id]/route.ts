import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validations/events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do evento não fornecido." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        sectors: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error: unknown) {
    console.error("Erro ao buscar evento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao buscar evento." },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas organizadores podem editar eventos." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do evento não fornecido." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este evento." },
        { status: 403 }
      );
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

    const {
      title,
      description,
      category,
      bannerUrl,
      locationName,
      city,
      eventDate,
      endDate,
      entryStartTime,
      isAdult,
    } = validation.data;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        category,
        bannerUrl,
        locationName,
        city,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        entryStartTime: new Date(entryStartTime),
        isAdult: isAdult ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: unknown) {
    console.error("Erro ao atualizar evento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao atualizar evento." },
      { status: 500 }
    );
  }
}
