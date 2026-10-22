import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/lazy-expiration";
import { generateSecureGatekeeperPassword } from "@/lib/crypto";
import { EventCategory, EventStatus } from "@prisma/client";
import { CreateEventInput, UpdateEventInput } from "@/lib/validations/events";
import { ServiceError } from "./errors";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface EventFilterParams {
  q?: string;
  category?: string;
  categories?: string[];
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  status?: EventStatus;
}

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

export async function listPublicEvents(filters: EventFilterParams) {
  const { q, category, categories, city, minPrice, maxPrice, startDate, endDate, sort = "date_asc", status = "PUBLISHED" } = filters;
  const categoriesArray = categories && categories.length > 0 ? categories : (category ? [category] : undefined);

  const events = await prisma.event.findMany({
    where: {
      status,
      ...(startDate || endDate
        ? {
            eventDate: {
              ...(startDate ? { gte: new Date(startDate) } : { gte: new Date() }),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : { eventDate: { gte: new Date() } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { locationName: { contains: q, mode: "insensitive" } },
          { street: { contains: q, mode: "insensitive" } },
          { neighborhood: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(categoriesArray && categoriesArray.length > 0 && {
        category: { in: categoriesArray as EventCategory[] },
      }),
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        sectors: {
          some: {
            price: {
              ...(minPrice !== undefined && !isNaN(minPrice) ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined && !isNaN(maxPrice) ? { lte: maxPrice } : {}),
            },
          },
        },
      }),
    },
    include: { sectors: true },
  });

  const formattedEvents = events.map((event) => {
    const minPriceVal =
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
      street: event.street,
      number: event.number,
      neighborhood: event.neighborhood,
      city: event.city,
      eventDate: event.eventDate,
      endDate: event.endDate,
      entryStartTime: event.entryStartTime,
      isAdult: event.isAdult,
      minPrice: minPriceVal,
      status: event.status,
      sectors: event.sectors,
    };
  });

  formattedEvents.sort((a, b) => {
    if (sort === "price_asc") return a.minPrice - b.minPrice;
    if (sort === "price_desc") return b.minPrice - a.minPrice;
    if (sort === "title_asc") return a.title.localeCompare(b.title);
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
  });

  return formattedEvents;
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { sectors: true },
  });
  if (!event) throw new ServiceError("Evento não encontrado.", 404);
  return event;
}

export async function createEvent(organizerId: string, data: CreateEventInput) {
  return prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        eventDate: new Date(data.eventDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        entryStartTime: new Date(data.entryStartTime),
        locationName: data.locationName,
        street: data.street,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        bannerUrl: data.bannerUrl,
        isAdult: data.isAdult ?? false,
        organizerId,
        status: "PUBLISHED",
      },
    });

    for (const sectorData of data.sectors) {
      if (sectorData.type === "GENERAL_ADMISSION") {
        const capacity = sectorData.totalCapacity!;
        await tx.sector.create({
          data: {
            eventId: newEvent.id,
            name: sectorData.name,
            type: "GENERAL_ADMISSION",
            price: sectorData.price,
            totalCapacity: capacity,
            availableCapacity: capacity,
          },
        });
      } else if (sectorData.type === "NUMBERED_SEATS") {
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
          },
        });

        const seatsData = [];
        for (const row of rows) {
          for (let i = 1; i <= seatsPerRow; i++) {
            seatsData.push({
              sectorId: newSector.id,
              row: row.trim().toUpperCase(),
              number: i,
              status: "AVAILABLE" as const,
            });
          }
        }

        await tx.seat.createMany({ data: seatsData });
      }
    }

    return newEvent;
  });
}

export async function updateEvent(organizerId: string, eventId: string, data: UpdateEventInput) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ServiceError("Evento não encontrado.", 404);
  if (event.organizerId !== organizerId) {
    throw new ServiceError("Você não tem permissão para editar este evento.", 403);
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      bannerUrl: data.bannerUrl,
      locationName: data.locationName,
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood,
      city: data.city,
      eventDate: new Date(data.eventDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      entryStartTime: new Date(data.entryStartTime),
      isAdult: data.isAdult ?? false,
    },
  });
}

export async function updateEventStatus(organizerId: string, eventId: string, status: EventStatus) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ServiceError("Evento não encontrado", 404, "NOT_FOUND");
  if (event.organizerId !== organizerId) {
    throw new ServiceError("Você não tem permissão para gerenciar este evento.", 403, "FORBIDDEN");
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { status },
  });
}

export async function getEventSeatsWithExpiration(eventId: string) {
  await releaseExpiredReservations(eventId);

  const sectors = await prisma.sector.findMany({
    where: { eventId },
    include: {
      seats: {
        orderBy: [{ row: "asc" }, { number: "asc" }],
        include: {
          reservationItems: {
            where: { reservation: { status: "PENDING" } },
            select: { reservationId: true },
          },
        },
      },
    },
  });

  if (!sectors || sectors.length === 0) {
    throw new ServiceError("Evento não encontrado ou sem setores", 404);
  }

  return sectors;
}

export async function listEventGatekeepers(organizerId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      gatekeepers: {
        include: {
          gatekeeper: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) throw new ServiceError("Evento não encontrado.", 404);
  if (event.organizerId !== organizerId) {
    throw new ServiceError("Você não tem permissão para gerenciar a portaria deste evento.", 403);
  }

  return event.gatekeepers.map((eg) => ({
    id: eg.gatekeeper.id,
    name: eg.gatekeeper.name,
    email: eg.gatekeeper.email,
    assignedAt: eg.createdAt,
  }));
}

export async function assignEventGatekeeper(
  organizerId: string,
  eventId: string,
  data: { name: string; email?: string; password?: string; autoGenerate?: boolean }
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ServiceError("Evento não encontrado.", 404);
  if (event.organizerId !== organizerId) {
    throw new ServiceError("Você não tem permissão para adicionar portaria a este evento.", 403);
  }

  const { name, autoGenerate } = data;
  let email = data.email?.trim();
  let rawPassword = data.password?.trim();

  if (autoGenerate || !email) {
    const cleanTitle = event.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8);
    const randomSuffix = crypto.randomBytes(2).toString("hex");
    email = `portaria-${cleanTitle}-${randomSuffix}@verzel.com.br`;
  }

  if (autoGenerate || !rawPassword) {
    rawPassword = generateSecureGatekeeperPassword();
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.role === "GATEKEEPER") {
      const existingLink = await prisma.eventGatekeeper.findUnique({
        where: {
          eventId_gatekeeperId: { eventId: event.id, gatekeeperId: existingUser.id },
        },
      });

      if (existingLink) {
        throw new ServiceError("Este operador de portaria já está vinculado ao evento.", 409);
      }

      await prisma.eventGatekeeper.create({
        data: { eventId: event.id, gatekeeperId: existingUser.id },
      });

      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        assignedAt: new Date().toISOString(),
      };
    } else {
      throw new ServiceError("O e-mail informado pertence a um usuário que não é operador de portaria.", 400);
    }
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email: email!, passwordHash, role: "GATEKEEPER" },
    });

    const eventLink = await tx.eventGatekeeper.create({
      data: { eventId: event.id, gatekeeperId: newUser.id },
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      assignedAt: eventLink.createdAt.toISOString(),
      generatedPassword: rawPassword,
    };
  });
}

export async function removeEventGatekeeper(organizerId: string, eventId: string, gatekeeperId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new ServiceError("Evento não encontrado.", 404);
  if (event.organizerId !== organizerId) {
    throw new ServiceError("Você não tem permissão para gerenciar a portaria deste evento.", 403);
  }

  const existingLink = await prisma.eventGatekeeper.findUnique({
    where: { eventId_gatekeeperId: { eventId, gatekeeperId } },
  });

  if (!existingLink) {
    throw new ServiceError("Operador de portaria não encontrado neste evento.", 404);
  }

  await prisma.eventGatekeeper.delete({
    where: { eventId_gatekeeperId: { eventId, gatekeeperId } },
  });

  return { message: "Operador de portaria desvinculado do evento com sucesso." };
}

export async function getOrganizerAnalytics(organizerId: string, eventId?: string | null) {
  const organizerEvents = await prisma.event.findMany({
    where: { organizerId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const isSingleEvent = Boolean(eventId && eventId !== "all");
  let targetEventIds: string[] = [];

  if (isSingleEvent && eventId) {
    const eventExists = organizerEvents.find((e) => e.id === eventId);
    if (!eventExists) {
      throw new ServiceError("Evento não encontrado ou não pertence a você.", 404);
    }
    targetEventIds = [eventId];
  } else {
    targetEventIds = organizerEvents.map((e) => e.id);
  }

  const tickets =
    targetEventIds.length > 0
      ? await prisma.ticket.findMany({
          where: {
            eventId: { in: targetEventIds },
            status: { in: ["ACTIVE", "USED"] },
          },
          include: { sector: true },
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
        const revenue = sectorTickets.reduce((acc, t) => acc + (t.sector?.price || 0), 0);
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
  const totalRevenue = tickets.reduce((acc, t) => acc + (t.sector?.price || 0), 0);
  const checkedInCount = tickets.filter((t) => t.status === "USED").length;

  const occupancyRate =
    totalCapacity > 0 ? Number(((totalTicketsSold / totalCapacity) * 100).toFixed(2)) : 0;
  const checkInRate =
    totalTicketsSold > 0 ? Number(((checkedInCount / totalTicketsSold) * 100).toFixed(2)) : 0;
  const averageTicketPrice =
    totalTicketsSold > 0 ? Number((totalRevenue / totalTicketsSold).toFixed(2)) : 0;

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

    const dayAmount = dateTickets.reduce((acc, t) => acc + (t.sector?.price || 0), 0);

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

  return {
    events: organizerEvents.map((e) => ({ id: e.id, title: e.title })),
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
  };
}
