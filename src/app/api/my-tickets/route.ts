import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { customerId: session.id },
      include: {
        event: true,
        sector: true,
        seat: true,
      },
      orderBy: { event: { eventDate: "asc" } },
    });

    const now = new Date();

    const upcomingTickets = tickets.filter(
      (t) => t.status === "ACTIVE" && new Date(t.event.eventDate) > now
    );

    const pastTickets = tickets.filter(
      (t) => t.status !== "ACTIVE" || new Date(t.event.eventDate) <= now
    );

    return NextResponse.json({ success: true, upcomingTickets, pastTickets }, { status: 200 });
  } catch (error) {
    console.error("GET /api/my-tickets Error:", error);
    return NextResponse.json({ error: "Erro ao buscar ingressos" }, { status: 500 });
  }
}
