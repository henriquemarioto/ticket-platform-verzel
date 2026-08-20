import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTicketSchema } from "@/lib/validations/gate";
import { parseAndVerifyQRPayload } from "@/lib/crypto";

async function getEventMetrics(targetEventId?: string | null) {
  if (!targetEventId) {
    return { totalSold: 0, totalCheckedIn: 0 };
  }
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
    console.error("[getEventMetrics Error]", error);
    return { totalSold: 0, totalCheckedIn: 0 };
  }
}

export async function POST(req: Request) {
  let targetEventId: string | undefined;
  try {
    const session = await getSession();
    if (!session || session.role !== "GATEKEEPER") {
      return NextResponse.json({ error: "Unauthorized", result: "INVALID_CODE" }, { status: 401 });
    }

    const body = await req.json();
    const result = validateTicketSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
    }

    const { eventId, qrPayload, ticketCode } = result.data;
    targetEventId = eventId;
    
    let codeToSearch = ticketCode;
    const rawPayload = qrPayload || ticketCode || "UNKNOWN";

    // 1. Validar se o operador está autorizado para este evento
    const gatekeeperLink = await prisma.eventGatekeeper.findUnique({
      where: {
        eventId_gatekeeperId: {
          eventId,
          gatekeeperId: session.id,
        },
      },
    });

    if (!gatekeeperLink) {
      await prisma.ticketValidationLog.create({
        data: {
          gatekeeperId: session.id,
          result: "INVALID_CODE",
          rawPayload,
          message: "Operador de portaria não autorizado para este evento",
        },
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json(
        { error: "Acesso negado. Você não está autorizado para validar ingressos deste evento.", result: "INVALID_CODE", eventMetrics },
        { status: 403 }
      );
    }

    if (qrPayload) {
      const parsed = parseAndVerifyQRPayload(qrPayload);
      if (!parsed || !parsed.isValidSignature) {
        await prisma.ticketValidationLog.create({
          data: {
            gatekeeperId: session.id,
            result: "INVALID_CODE",
            rawPayload,
            message: "Assinatura HMAC inválida ou malformada",
          }
        });
        const eventMetrics = await getEventMetrics(targetEventId);
        return NextResponse.json({ result: "INVALID_CODE", message: "Código Inválido ou HMAC Forjado", eventMetrics });
      }
      codeToSearch = parsed.ticketCode;
    }

    if (!codeToSearch) {
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({ result: "INVALID_CODE", message: "Código Inválido", eventMetrics });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode: codeToSearch },
      include: {
        event: true,
        sector: true,
        seat: true,
        customer: {
          select: { name: true }
        }
      }
    });

    if (!ticket) {
      await prisma.ticketValidationLog.create({
        data: {
          gatekeeperId: session.id,
          result: "INVALID_CODE",
          rawPayload,
          message: "Código de ingresso inexistente",
        }
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({ result: "INVALID_CODE", message: "Código Inválido ou Inexistente", eventMetrics });
    }

    // 2. Validar se o ingresso pertence ao evento correto
    if (ticket.eventId !== eventId) {
      await prisma.ticketValidationLog.create({
        data: {
          ticketId: ticket.id,
          gatekeeperId: session.id,
          result: "WRONG_EVENT",
          rawPayload,
          message: `Ingresso pertence ao evento: ${ticket.event.title}`,
        }
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({ 
        result: "WRONG_EVENT", 
        message: "Evento Incorreto",
        expectedEvent: ticket.event.title,
        eventMetrics,
      });
    }

    // 3. Validar se os portões do evento já estão abertos
    const now = new Date();
    if (now < ticket.event.entryStartTime) {
      const openingTimeStr = ticket.event.entryStartTime.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      await prisma.ticketValidationLog.create({
        data: {
          ticketId: ticket.id,
          gatekeeperId: session.id,
          result: "INVALID_CODE",
          rawPayload,
          message: `Entrada não permitida: portões abrem às ${openingTimeStr}`,
        },
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({
        result: "INVALID_CODE",
        message: `Entrada Não Permitida: Os portões deste evento abrem às ${openingTimeStr}`,
        eventMetrics,
      });
    }

    // 4. Validar se o evento já encerrou
    const eventEndTime = ticket.event.endDate
      ? new Date(ticket.event.endDate)
      : new Date(new Date(ticket.event.eventDate).getTime() + 6 * 60 * 60 * 1000);

    if (now > eventEndTime) {
      await prisma.ticketValidationLog.create({
        data: {
          ticketId: ticket.id,
          gatekeeperId: session.id,
          result: "INVALID_CODE",
          rawPayload,
          message: "Entrada não permitida: este evento já foi encerrado",
        },
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({
        result: "INVALID_CODE",
        message: "Entrada Não Permitida: Este evento já foi encerrado.",
        eventMetrics,
      });
    }

    // Validação específica para status CANCELLED
    if (ticket.status === "CANCELLED") {
      await prisma.ticketValidationLog.create({
        data: {
          ticketId: ticket.id,
          gatekeeperId: session.id,
          result: "INVALID_CODE",
          rawPayload,
          message: "Ingresso Cancelado pelo Cliente",
        },
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({
        result: "INVALID_CODE",
        message: "Ingresso Cancelado",
        eventMetrics,
      });
    }

    if (ticket.status !== "ACTIVE") {
      await prisma.ticketValidationLog.create({
        data: {
          ticketId: ticket.id,
          gatekeeperId: session.id,
          result: "ALREADY_USED",
          rawPayload,
          message: `Ingresso já utilizado em ${ticket.usedAt?.toISOString() || 'desconhecido'}`,
        }
      });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({ 
        result: "ALREADY_USED", 
        message: "Ingresso Já Utilizado",
        usedAt: ticket.usedAt,
        eventMetrics,
      });
    }

    // Atomic transaction anti-double booking
    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticket.id,
        status: "ACTIVE",
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      }
    });

    if (updateResult.count === 0) {
      // Concurrency check failed
      await prisma.ticketValidationLog.create({
        data: {
          ticketId: ticket.id,
          gatekeeperId: session.id,
          result: "ALREADY_USED",
          rawPayload,
          message: "Ingresso validado concorrentemente",
        }
      });
      
      const concurrentTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      const eventMetrics = await getEventMetrics(targetEventId);
      return NextResponse.json({ 
        result: "ALREADY_USED", 
        message: "Ingresso Já Utilizado",
        usedAt: concurrentTicket?.usedAt,
        eventMetrics,
      });
    }

    // Sucesso
    await prisma.ticketValidationLog.create({
      data: {
        ticketId: ticket.id,
        gatekeeperId: session.id,
        result: "VALID",
        rawPayload,
        message: "Acesso Liberado",
      }
    });

    const eventMetrics = await getEventMetrics(targetEventId);

    return NextResponse.json({
      result: "VALID",
      message: "Acesso Liberado",
      ticket: {
        code: ticket.ticketCode,
        customerName: ticket.customer.name,
        sectorName: ticket.sector.name,
        seat: ticket.seat ? `${ticket.seat.row.toUpperCase()}${ticket.seat.number}` : null,
      },
      eventMetrics,
    });

  } catch (error) {
    console.error("[Gate Validate Error]", error);
    const eventMetrics = await getEventMetrics(targetEventId);
    return NextResponse.json({ error: "Internal Server Error", result: "INVALID_CODE", eventMetrics }, { status: 500 });
  }
}
