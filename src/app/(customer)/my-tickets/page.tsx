import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TicketTabs } from "./_components/ticket-tabs";

export const metadata = {
  title: "Meus Ingressos | Verzel Tickets",
  description: "Gerencie e visualize seus ingressos e vouchers",
};

export default async function MyTicketsPage() {
  const session = await getSession();

  if (!session || session.role !== "CUSTOMER") {
    redirect("/login");
  }

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

  // Convert plain objects if necessary for Client Components (Next.js 14+ supports Date directly but it's safer to ensure serializability if not using React Server Components experimental features, though Prisma results usually work fine).
  const upcomingTickets = tickets.filter(
    (t) => t.status === "ACTIVE" && new Date(t.event.eventDate) > now
  );

  const pastTickets = tickets.filter(
    (t) => t.status !== "ACTIVE" || new Date(t.event.eventDate) <= now
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Meus Ingressos</h1>
      <p className="text-text-muted mb-8">
        Visualize seus vouchers, apresente seu QR Code na entrada ou consulte seu histórico de eventos.
      </p>

      <TicketTabs upcomingTickets={upcomingTickets} pastTickets={pastTickets} />
    </div>
  );
}
