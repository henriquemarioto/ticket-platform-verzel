import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listCustomerTickets } from "@/services/ticket.service";
import { handleApiError } from "@/services/errors";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tickets = await listCustomerTickets(session.id);

    return NextResponse.json({
      success: true,
      ...tickets,
    });
  } catch (error) {
    return handleApiError(error, "MyTicketsRoute", "Erro ao buscar ingressos");
  }
}
