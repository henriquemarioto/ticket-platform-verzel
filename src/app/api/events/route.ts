import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/events";

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

    const { title, description, category, eventDate, locationName, city, bannerUrl, sectors } = validation.data;

    // Prisma Transaction
    const event = await prisma.$transaction(async (tx) => {
      // 1. Create the Event
      const newEvent = await tx.event.create({
        data: {
          title,
          description,
          category,
          eventDate: new Date(eventDate),
          locationName,
          city,
          bannerUrl,
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

  } catch (error: any) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar evento." },
      { status: 500 }
    );
  }
}
