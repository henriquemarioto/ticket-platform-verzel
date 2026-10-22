import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { parseAndVerifyQRPayload } from "@/lib/crypto";
import { EventStatus, ValidationResult } from "@prisma/client";
import { ServiceError } from "./errors";

export async function getEventMetrics(targetEventId?: string | null) {
  if (!targetEventId) return { totalSold: 0, totalCheckedIn: 0 };
  try {
    const [totalSold, totalCheckedIn] = await Promise.all([
      prisma.ticket.count({
        where: {
          eventId: targetEventId,
          status: { in: ["ACTIVE", "USED"] },
        },
      }),
      prisma.ticket.count({
        where: {
          eventId: targetEventId,
          status: "USED",
        },
      }),
    ]);
    return { totalSold, totalCheckedIn };
  } catch (error) {
    logger.error("[GateService.getEventMetrics] Erro ao buscar métricas", error, { targetEventId });
    return { totalSold: 0, totalCheckedIn: 0 };
  }
}

export async function recordValidationLog(data: {
  gatekeeperId: string;
  result: ValidationResult;
  rawPayload: string;
  message: string;
  ticketId?: string;
}) {
  return prisma.ticketValidationLog.create({
    data: {
      gatekeeperId: data.gatekeeperId,
      result: data.result,
      rawPayload: data.rawPayload,
      message: data.message,
      ticketId: data.ticketId,
    },
  });
}

export async function validateGateTicket(input: {
  gatekeeperId: string;
  eventId: string;
  qrPayload?: string;
  ticketCode?: string;
}) {
  const { gatekeeperId, eventId, qrPayload, ticketCode } = input;
  const rawPayload = qrPayload || ticketCode || "UNKNOWN";

  // 1. Autorização do operador
  const gatekeeperLink = await prisma.eventGatekeeper.findUnique({
    where: {
      eventId_gatekeeperId: {
        eventId,
        gatekeeperId,
      },
    },
  });

  if (!gatekeeperLink) {
    await recordValidationLog({
      gatekeeperId,
      result: "INVALID_CODE",
      rawPayload,
      message: "Operador de portaria não autorizado para este evento",
    });
    const eventMetrics = await getEventMetrics(eventId);
    throw new ServiceError(
      "Acesso negado. Você não está autorizado para validar ingressos deste evento.",
      403,
      "FORBIDDEN",
      { result: "INVALID_CODE", eventMetrics }
    );
  }

  // 2. Extração e validação HMAC do QR Code
  let codeToSearch = ticketCode;
  if (qrPayload) {
    const parsed = parseAndVerifyQRPayload(qrPayload);
    if (!parsed || !parsed.isValidSignature) {
      await recordValidationLog({
        gatekeeperId,
        result: "INVALID_CODE",
        rawPayload,
        message: "Assinatura HMAC inválida ou malformada",
      });
      const eventMetrics = await getEventMetrics(eventId);
      return { result: "INVALID_CODE", message: "Código Inválido ou HMAC Forjado", eventMetrics };
    }
    codeToSearch = parsed.ticketCode;
  }

  if (!codeToSearch) {
    const eventMetrics = await getEventMetrics(eventId);
    return { result: "INVALID_CODE", message: "Código Inválido", eventMetrics };
  }

  // 3. Busca do Ingresso
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: codeToSearch },
    include: {
      event: true,
      sector: true,
      seat: true,
      customer: { select: { name: true } },
    },
  });

  if (!ticket) {
    await recordValidationLog({
      gatekeeperId,
      result: "INVALID_CODE",
      rawPayload,
      message: "Código de ingresso inexistente",
    });
    const eventMetrics = await getEventMetrics(eventId);
    return { result: "INVALID_CODE", message: "Código Inválido ou Inexistente", eventMetrics };
  }

  // 4. Verificação de Evento Correto
  if (ticket.eventId !== eventId) {
    await recordValidationLog({
      ticketId: ticket.id,
      gatekeeperId,
      result: "WRONG_EVENT",
      rawPayload,
      message: `Ingresso pertence ao evento: ${ticket.event.title}`,
    });
    const eventMetrics = await getEventMetrics(eventId);
    return {
      result: "WRONG_EVENT",
      message: "Evento Incorreto",
      expectedEvent: ticket.event.title,
      eventMetrics,
    };
  }

  // 5. Horário de Abertura dos Portões
  const now = new Date();
  if (now < ticket.event.entryStartTime) {
    const openingTimeStr = ticket.event.entryStartTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    await recordValidationLog({
      ticketId: ticket.id,
      gatekeeperId,
      result: "INVALID_CODE",
      rawPayload,
      message: `Entrada não permitida: portões abrem às ${openingTimeStr}`,
    });
    const eventMetrics = await getEventMetrics(eventId);
    return {
      result: "INVALID_CODE",
      message: `Entrada Não Permitida: Os portões deste evento abrem às ${openingTimeStr}`,
      eventMetrics,
    };
  }

  // 6. Encerramento do Evento
  const eventEndTime = ticket.event.endDate
    ? new Date(ticket.event.endDate)
    : new Date(new Date(ticket.event.eventDate).getTime() + 6 * 60 * 60 * 1000);

  if (now > eventEndTime) {
    await recordValidationLog({
      ticketId: ticket.id,
      gatekeeperId,
      result: "INVALID_CODE",
      rawPayload,
      message: "Entrada não permitida: este evento já foi encerrado",
    });
    const eventMetrics = await getEventMetrics(eventId);
    return {
      result: "INVALID_CODE",
      message: "Entrada Não Permitida: Este evento já foi encerrado.",
      eventMetrics,
    };
  }

  // 7. Status do Ingresso
  if (ticket.status === "CANCELLED") {
    await recordValidationLog({
      ticketId: ticket.id,
      gatekeeperId,
      result: "INVALID_CODE",
      rawPayload,
      message: "Ingresso Cancelado pelo Cliente",
    });
    const eventMetrics = await getEventMetrics(eventId);
    return { result: "INVALID_CODE", message: "Ingresso Cancelado", eventMetrics };
  }

  if (ticket.status !== "ACTIVE") {
    await recordValidationLog({
      ticketId: ticket.id,
      gatekeeperId,
      result: "ALREADY_USED",
      rawPayload,
      message: `Ingresso já utilizado em ${ticket.usedAt?.toISOString() || "desconhecido"}`,
    });
    const eventMetrics = await getEventMetrics(eventId);
    return {
      result: "ALREADY_USED",
      message: "Ingresso Já Utilizado",
      usedAt: ticket.usedAt,
      eventMetrics,
    };
  }

  // 8. Lock Atômico Otimista Concorrente (Anti-Double Entry)
  const updateResult = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "ACTIVE" },
    data: { status: "USED", usedAt: new Date() },
  });

  if (updateResult.count === 0) {
    await recordValidationLog({
      ticketId: ticket.id,
      gatekeeperId,
      result: "ALREADY_USED",
      rawPayload,
      message: "Ingresso validado concorrentemente",
    });
    const concurrentTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    const eventMetrics = await getEventMetrics(eventId);
    return {
      result: "ALREADY_USED",
      message: "Ingresso Já Utilizado",
      usedAt: concurrentTicket?.usedAt,
      eventMetrics,
    };
  }

  // 9. Sucesso: Ingresso Validado
  await recordValidationLog({
    ticketId: ticket.id,
    gatekeeperId,
    result: "VALID",
    rawPayload,
    message: "Acesso Liberado",
  });

  const eventMetrics = await getEventMetrics(eventId);
  return {
    result: "VALID",
    message: "Acesso Liberado",
    ticket: {
      code: ticket.ticketCode,
      customerName: ticket.customer.name,
      sectorName: ticket.sector.name,
      seat: ticket.seat ? `${ticket.seat.row.toUpperCase()}${ticket.seat.number}` : null,
    },
    eventMetrics,
  };
}

export async function listAuthorizedGatekeeperEvents(gatekeeperId: string) {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      status: { in: [EventStatus.PUBLISHED, EventStatus.CLOSED] },
      gatekeepers: { some: { gatekeeperId } },
    },
    orderBy: { eventDate: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      bannerUrl: true,
      locationName: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      eventDate: true,
      endDate: true,
      entryStartTime: true,
      status: true,
      tickets: { select: { id: true, status: true } },
    },
  });

  return events.map((event) => {
    const totalSold = event.tickets.filter((t) => t.status === "ACTIVE" || t.status === "USED").length;
    const totalCheckedIn = event.tickets.filter((t) => t.status === "USED").length;
    const eventEndTime = event.endDate
      ? new Date(event.endDate)
      : new Date(new Date(event.eventDate).getTime() + 6 * 60 * 60 * 1000);
    const isEntryOpen = now >= new Date(event.entryStartTime);
    const isEnded = now >= eventEndTime;
    const isSelectable = isEntryOpen && !isEnded;

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
      eventDate: event.eventDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
      entryStartTime: event.entryStartTime.toISOString(),
      isEntryOpen,
      isEnded,
      isSelectable,
      status: event.status,
      totalSold,
      totalCheckedIn,
    };
  });
}
