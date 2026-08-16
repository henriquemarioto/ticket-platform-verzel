import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateSharePasscode } from "@/lib/crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        customerId: true,
        shareToken: true,
        status: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ingresso não encontrado" }, { status: 404 });
    }

    if (ticket.customerId !== session.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Gera o passcode para adicionar uma camada de segurança extra
    const passcode = generateSharePasscode(ticket.shareToken);
    const shareUrl = `/tickets/share/${ticket.shareToken}?key=${passcode}`;

    return NextResponse.json({
      success: true,
      shareToken: ticket.shareToken,
      shareUrl,
    });
  } catch (error) {
    console.error("Share ticket error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar link de compartilhamento" },
      { status: 500 }
    );
  }
}
