import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/lazy-expiration";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "O ID do evento é obrigatório" }, { status: 400 });
    }

    // Lazy Expiration: Expira reservas pendentes e libera assentos antes de listar
    await releaseExpiredReservations(id);

    // Retorna setores e seus assentos para esse evento
    const sectors = await prisma.sector.findMany({
      where: { eventId: id },
      include: {
        seats: {
          orderBy: [
            { row: "asc" },
            { number: "asc" }
          ]
        },
      },
    });

    if (!sectors || sectors.length === 0) {
      return NextResponse.json({ error: "Evento não encontrado ou sem setores" }, { status: 404 });
    }

    return NextResponse.json({ success: true, sectors });
  } catch (error) {
    console.error("[GET_SEATS_ERROR]", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
