import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTicketSchema } from "@/lib/validations/gate";
import { parseAndVerifyQRPayload } from "@/lib/crypto";

export async function POST(req: Request) {
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
    
    let codeToSearch = ticketCode;
    const rawPayload = qrPayload || ticketCode || "UNKNOWN";

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
        return NextResponse.json({ result: "INVALID_CODE", message: "Código Inválido ou HMAC Forjado" });
      }
      codeToSearch = parsed.ticketCode;
    }

    if (!codeToSearch) {
       return NextResponse.json({ result: "INVALID_CODE", message: "Código Inválido" });
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
      return NextResponse.json({ result: "INVALID_CODE", message: "Código Inválido ou Inexistente" });
    }

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
      return NextResponse.json({ 
        result: "WRONG_EVENT", 
        message: "Evento Incorreto",
        expectedEvent: ticket.event.title
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
      return NextResponse.json({ 
        result: "ALREADY_USED", 
        message: "Ingresso Já Utilizado",
        usedAt: ticket.usedAt
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
      return NextResponse.json({ 
        result: "ALREADY_USED", 
        message: "Ingresso Já Utilizado",
        usedAt: concurrentTicket?.usedAt
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

    return NextResponse.json({
      result: "VALID",
      message: "Acesso Liberado",
      ticket: {
        code: ticket.ticketCode,
        customerName: ticket.customer.name,
        sectorName: ticket.sector.name,
        seat: ticket.seat ? `${ticket.seat.row}${ticket.seat.number}` : null,
      }
    });

  } catch (error) {
    console.error("[Gate Validate Error]", error);
    return NextResponse.json({ error: "Internal Server Error", result: "INVALID_CODE" }, { status: 500 });
  }
}
