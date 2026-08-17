import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EventStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const roleHeader = request.headers.get("x-user-role");
    const userRole = session?.role || roleHeader;

    if (!userRole) {
      return NextResponse.json(
        { error: "Não autorizado. Sessão necessária." },
        { status: 401 }
      );
    }

    if (userRole !== "GATEKEEPER") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas operadores de portaria podem acessar esta rota." },
        { status: 403 }
      );
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

    const formattedEvents = events.map((event) => {
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

    return NextResponse.json(
      {
        success: true,
        events: formattedEvents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar eventos da portaria:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar eventos da portaria" },
      { status: 500 }
    );
  }
}
