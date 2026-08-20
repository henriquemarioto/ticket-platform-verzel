import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventStatusActions } from "@/components/modules/events/EventStatusActions";
import { EventGatekeeperButton } from "@/components/modules/organizer/EventGatekeeperButton";
import { formatShortDateRange } from "@/lib/utils/date-formatters";
import { Edit, Plus, PlusCircle, BarChart2 } from "lucide-react";

export default async function OrganizerDashboardPage() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const userRole = headersList.get("x-user-role");

  if (!userId || userRole !== "ORGANIZER") {
    redirect("/login");
  }

  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      sectors: true,
      _count: {
        select: { tickets: true }
      }
    }
  });

  const getStatusBadgeVariant = (status: string): "success" | "warning" | "danger" | "neutral" => {
    switch (status) {
      case "PUBLISHED": return "success";
      case "CLOSED": return "warning";
      case "CANCELLED": return "danger";
      default: return "neutral";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "Rascunho";
      case "PUBLISHED": return "Publicado";
      case "CLOSED": return "Encerrado";
      case "FINISHED": return "Finalizado";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Eventos</h1>
          <p className="text-text-muted mt-1">Gerencie os eventos que você organiza.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/organizer/events/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Evento
            </Button>
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-bg-surface rounded-xl shadow-sm">
          <p className="text-text-muted mb-4">Você ainda não possui eventos cadastrados.</p>
          <Link href="/organizer/events/create">
            <Button variant="outline">Começar agora</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-sm bg-bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-main border-b border-border-subtle text-text-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Evento</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Ocupação</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {events.map((event) => {
                const totalCapacity = event.sectors.reduce((acc, sector) => acc + sector.totalCapacity, 0);
                const soldTickets = event._count.tickets;
                
                return (
                  <tr key={event.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {event.bannerUrl ? (
                          <img 
                            src={event.bannerUrl} 
                            alt={event.title}
                            className="w-12 h-12 rounded object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-bg-main shadow-sm flex items-center justify-center">
                            <span className="text-xs text-text-muted">Sem Img</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-text-primary">{event.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-text-muted">{event.category}</span>
                            {event.isAdult && (
                              <span 
                                className="inline-flex items-center justify-center rounded bg-danger/15 px-1 py-0.2 text-[10px] font-bold text-danger leading-none"
                                title="Classificação indicativa: +18"
                              >
                                +18
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                      {formatShortDateRange(event.eventDate, event.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 w-32">
                        <span className="font-medium text-text-primary">
                          {soldTickets} / {totalCapacity}
                        </span>
                        <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${totalCapacity > 0 ? Math.min(100, (soldTickets / totalCapacity) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EventStatusActions eventId={event.id} currentStatus={event.status} />
                        <EventGatekeeperButton eventId={event.id} eventTitle={event.title} />
                        <Link href={`/organizer/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4"/></Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
