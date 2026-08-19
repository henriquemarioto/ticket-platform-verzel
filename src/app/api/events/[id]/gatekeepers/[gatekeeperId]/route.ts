import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
        { error: "Não autorizado. Apenas organizadores podem gerenciar portaria." },
        { status: 403 }
      );
    }

    const { id: eventId, gatekeeperId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para gerenciar a portaria deste evento." },
        { status: 403 }
      );
    }

    const existingLink = await prisma.eventGatekeeper.findUnique({
      where: {
        eventId_gatekeeperId: {
          eventId,
          gatekeeperId,
        },
      },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: "Operador de portaria não encontrado neste evento." },
        { status: 404 }
      );
    }

    await prisma.eventGatekeeper.delete({
      where: {
        eventId_gatekeeperId: {
          eventId,
          gatekeeperId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Operador de portaria desvinculado do evento com sucesso.",
    });
  } catch (error: unknown) {
    console.error("Erro ao desvincular operador de portaria:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao desvincular operador." },
      { status: 500 }
    );
  }
}
