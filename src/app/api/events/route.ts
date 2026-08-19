import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/events";
import { EventCategory, EventStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") || searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = (searchParams.get("status") as EventStatus) || "PUBLISHED";

    const events = await prisma.event.findMany({
      where: {
        status,
        eventDate: {
          gte: new Date(),
        },
        ...(q && {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { locationName: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(category && {
          category: category as EventCategory,
        }),
      },
      include: {
        sectors: true,
      },
      orderBy: {
        eventDate: "asc",
      },
    });

    const formattedEvents = events.map((event) => {
      const minPrice =
        event.sectors.length > 0
          ? Math.min(...event.sectors.map((s) => s.price))
          : 0;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        bannerUrl: event.bannerUrl,
        locationName: event.locationName,
        city: event.city,
        eventDate: event.eventDate,
        endDate: event.endDate,
        entryStartTime: event.entryStartTime,
        isAdult: event.isAdult,
        minPrice,
        status: event.status,
        sectors: event.sectors,
      };
    });

    return NextResponse.json({
      success: true,
      total: formattedEvents.length,
      events: formattedEvents,
    });
  } catch (error: unknown) {
    console.error("Erro ao listar eventos:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao listar eventos." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id");

    if (role !== "ORGANIZER" || !userId) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas organizadores podem criar eventos." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados de evento inválidos.", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, category, eventDate, endDate, entryStartTime, locationName, city, bannerUrl, isAdult, sectors } = validation.data;

    // Prisma Transaction
    const event = await prisma.$transaction(async (tx) => {
      // 1. Create the Event
      const newEvent = await tx.event.create({
        data: {
          title,
          description,
          category,
          eventDate: new Date(eventDate),
          endDate: endDate ? new Date(endDate) : null,
          entryStartTime: new Date(entryStartTime),
          locationName,
          city,
          bannerUrl,
          isAdult: isAdult ?? false,
          organizerId: userId,
          status: "PUBLISHED",
        }
      });

      // 2. Iterar sobre os setores e cria-los atomicamente
      for (const sectorData of sectors) {
        if (sectorData.type === "GENERAL_ADMISSION") {
          // Pista
          const capacity = sectorData.totalCapacity!;
          
          await tx.sector.create({
            data: {
              eventId: newEvent.id,
              name: sectorData.name,
              type: "GENERAL_ADMISSION",
              price: sectorData.price,
              totalCapacity: capacity,
              availableCapacity: capacity,
            }
          });

        } else if (sectorData.type === "NUMBERED_SEATS") {
          // Numerado
          const rows = sectorData.rows!;
          const seatsPerRow = sectorData.seatsPerRow!;
          const capacity = rows.length * seatsPerRow;

          const newSector = await tx.sector.create({
            data: {
              eventId: newEvent.id,
              name: sectorData.name,
              type: "NUMBERED_SEATS",
              price: sectorData.price,
              totalCapacity: capacity,
              availableCapacity: capacity,
            }
          });

          // Gerar matriz de assentos
          const seatsData = [];
          for (const row of rows) {
            for (let i = 1; i <= seatsPerRow; i++) {
              seatsData.push({
                sectorId: newSector.id,
                row,
                number: i,
                status: "AVAILABLE" as const,
              });
            }
          }

          // Inserção massiva
          await tx.seat.createMany({
            data: seatsData
          });
        }
      }

      return newEvent;
    });

    return NextResponse.json(
      { success: true, event },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar evento." },
      { status: 500 }
    );
  }
}
