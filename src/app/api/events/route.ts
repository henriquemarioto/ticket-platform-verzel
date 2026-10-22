import { NextRequest, NextResponse } from "next/server";
import { createEventSchema } from "@/lib/validations/events";
import { listPublicEvents, createEvent } from "@/services/event.service";
import { handleApiError } from "@/services/errors";
import { EventStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") || searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const categoriesParam = searchParams.get("categories") || undefined;
    const city = searchParams.get("city") || undefined;
    const minPrice = searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const sort = searchParams.get("sort") || "date_asc";
    const status = (searchParams.get("status") as EventStatus) || "PUBLISHED";

    const categories = categoriesParam ? categoriesParam.split(",") : (category ? [category] : undefined);

    const events = await listPublicEvents({
      q,
      category,
      categories,
      city,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      sort,
      status,
    });

    return NextResponse.json({
      success: true,
      total: events.length,
      events,
    });
  } catch (error) {
    return handleApiError(error, "ListEventsRoute", "Erro interno no servidor ao listar eventos.");
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

    const event = await createEvent(userId, validation.data);

    return NextResponse.json(
      { success: true, event },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "CreateEventRoute", "Erro interno no servidor ao criar evento.");
  }
}
