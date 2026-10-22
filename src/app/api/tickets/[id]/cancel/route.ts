import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cancelCustomerTicket } from "@/services/ticket.service";
import { handleApiError } from "@/services/errors";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Apenas clientes podem cancelar ingressos" }, { status: 403 });
    }

    const { id: ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json({ error: "ID do ingresso não informado" }, { status: 400 });
    }

    const result = await cancelCustomerTicket(session.id, ticketId);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "CancelTicketRoute", "Erro interno no servidor ao cancelar ingresso");
  }
}
