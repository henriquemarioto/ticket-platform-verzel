import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface SectorMetric {
  sectorName: string;
  capacity: number;
  sold: number;
  available: number;
  revenue: number;
  occupancyRate: number;
}

export interface SalesTimelineItem {
  date: string;
  formattedDate: string;
  amount: number;
  tickets: number;
}

export interface AttendanceItem {
  name: string;
  value: number;
  color: string;
}

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id");

    if (role !== "ORGANIZER" || !userId) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas organizadores podem visualizar métricas." },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const eventId = searchParams.get("eventId");

    // Buscar todos os eventos do organizador
    const organizerEvents = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    });

    const isSingleEvent = Boolean(eventId && eventId !== "all");
    let targetEventIds: string[] = [];

    if (isSingleEvent && eventId) {
      const eventExists = organizerEvents.find((e) => e.id === eventId);
      if (!eventExists) {
        return NextResponse.json(
          { error: "Evento não encontrado ou não pertence a você." },
          { status: 404 }
        );
      }
      targetEventIds = [eventId];
    } else {
      targetEventIds = organizerEvents.map((e) => e.id);
    }

    // Ingressos vendidos (ACTIVE ou USED)
    const tickets =
      targetEventIds.length > 0
        ? await prisma.ticket.findMany({
            where: {
              eventId: { in: targetEventIds },
              status: { in: ["ACTIVE", "USED"] },
            },
            include: {
              sector: true,
            },
          })
        : [];

    let totalCapacity = 0;
    let sectorsDistribution: SectorMetric[] = [];

    if (isSingleEvent && eventId) {
      const sectors = await prisma.sector.findMany({
        where: { eventId },
      });
      totalCapacity = sectors.reduce((acc, s) => acc + s.totalCapacity, 0);

      sectorsDistribution = sectors
        .map((sector) => {
          const sectorTickets = tickets.filter((t) => t.sectorId === sector.id);
          const sold = sectorTickets.length;
          const available = Math.max(0, sector.totalCapacity - sold);
          const revenue = sectorTickets.reduce(
            (acc, t) => acc + (t.sector?.price || 0),
            0
          );
          const sectorOccupancy =
            sector.totalCapacity > 0
              ? Number(((sold / sector.totalCapacity) * 100).toFixed(2))
              : 0;

          return {
            sectorName: sector.name,
            capacity: sector.totalCapacity,
            sold,
            available,
            revenue: Number(revenue.toFixed(2)),
            occupancyRate: sectorOccupancy,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
    } else if (targetEventIds.length > 0) {
      const capacityAggregate = await prisma.sector.aggregate({
        where: { eventId: { in: targetEventIds } },
        _sum: { totalCapacity: true },
      });
      totalCapacity = capacityAggregate._sum.totalCapacity || 0;
    }

    const totalTicketsSold = tickets.length;
    const totalRevenue = tickets.reduce(
      (acc, t) => acc + (t.sector?.price || 0),
      0
    );
    const checkedInCount = tickets.filter((t) => t.status === "USED").length;

    const occupancyRate =
      totalCapacity > 0
        ? Number(((totalTicketsSold / totalCapacity) * 100).toFixed(2))
        : 0;

    const checkInRate =
      totalTicketsSold > 0
        ? Number(((checkedInCount / totalTicketsSold) * 100).toFixed(2))
        : 0;

    const averageTicketPrice =
      totalTicketsSold > 0
        ? Number((totalRevenue / totalTicketsSold).toFixed(2))
        : 0;

    // Últimos 7 dias em ordem cronológica
    const salesTimeline: SalesTimelineItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const formattedDate = `${day}/${month}`;

      const dateTickets = tickets.filter((t) => {
        const ticketDate = new Date(t.createdAt);
        const tYear = ticketDate.getFullYear();
        const tMonth = String(ticketDate.getMonth() + 1).padStart(2, "0");
        const tDay = String(ticketDate.getDate()).padStart(2, "0");
        return `${tYear}-${tMonth}-${tDay}` === dateStr;
      });

      const dayAmount = dateTickets.reduce(
        (acc, t) => acc + (t.sector?.price || 0),
        0
      );

      salesTimeline.push({
        date: dateStr,
        formattedDate,
        amount: Number(dayAmount.toFixed(2)),
        tickets: dateTickets.length,
      });
    }

    const attendanceDistribution: AttendanceItem[] = [
      {
        name: "Presentes (Check-in)",
        value: checkedInCount,
        color: "#005d3f",
      },
      {
        name: "Aguardando Entrada",
        value: Math.max(0, totalTicketsSold - checkedInCount),
        color: "#0057ff",
      },
      {
        name: "Vagas Disponíveis",
        value: Math.max(0, totalCapacity - totalTicketsSold),
        color: "#cbd5e1",
      },
    ];

    return NextResponse.json({
      events: organizerEvents.map((e) => ({
        id: e.id,
        title: e.title,
      })),
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalTicketsSold,
        totalCapacity,
        occupancyRate,
        checkedInCount,
        checkInRate,
        averageTicketPrice,
      },
      sectors: sectorsDistribution,
      salesTimeline,
      attendanceDistribution,
    });
  } catch (error: unknown) {
    console.error("Erro ao carregar analytics:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao carregar analytics." },
      { status: 500 }
    );
  }
}
