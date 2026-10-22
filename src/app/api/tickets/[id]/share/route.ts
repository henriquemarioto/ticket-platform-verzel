import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTicketShareLink } from "@/services/ticket.service";
import { handleApiError } from "@/services/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    const result = await createTicketShareLink(session.id, ticketId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "ShareTicketRoute", "Erro ao gerar link de compartilhamento");
  }
}
