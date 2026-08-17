import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventStatus } from "@prisma/client";
import { GatekeeperDashboard } from "@/components/modules/gatekeeper/GatekeeperDashboard";

export const metadata = {
  title: "Painel da Portaria | Verzel Tickets",
  description: "Controle de acesso e validação de ingressos em tempo real",
};

export default async function GatekeeperPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?returnUrl=/gatekeeper");
  }

  if (session.role !== "GATEKEEPER") {
    redirect("/forbidden");
  }

  const events = await prisma.event.findMany({
    where: {
      status: {
        in: [EventStatus.PUBLISHED, EventStatus.CLOSED],
      },
    },
    orderBy: {
      eventDate: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      bannerUrl: true,
      locationName: true,
      city: true,
      eventDate: true,
      status: true,
      tickets: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const initialEvents = events.map((event) => {
    const totalSold = event.tickets.filter(
      (t) => t.status === "ACTIVE" || t.status === "USED"
    ).length;
    const totalCheckedIn = event.tickets.filter(
      (t) => t.status === "USED"
    ).length;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      bannerUrl: event.bannerUrl,
      locationName: event.locationName,
      city: event.city,
      eventDate: event.eventDate.toISOString(),
      status: event.status,
      totalSold,
      totalCheckedIn,
    };
  });

  return <GatekeeperDashboard initialEvents={initialEvents} />;
}
