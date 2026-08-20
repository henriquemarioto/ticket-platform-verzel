import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reserveGeneralAdmissionSchema } from "@/lib/validations/reservation";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "CUSTOMER") {
      return NextResponse.json(
        {
          error: "Organizadores não podem comprar ingressos. Faça login como cliente.",
          code: "ORGANIZER_CANNOT_BUY",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = reserveGeneralAdmissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Dados inválidos", details: result.error.format() }, { status: 400 });
    }

    const { sectorId, quantity } = result.data;

    const reservation = await prisma.$transaction(async (tx) => {
      // 1. Busca o setor
      const sector = await tx.sector.findUnique({
        where: { id: sectorId },
      });

      if (!sector) {
        throw new Error("NOT_FOUND");
      }

      if (sector.type !== "GENERAL_ADMISSION") {
        throw new Error("INVALID_TYPE");
      }

      // 2. Decremento atômico
      const updateResult = await tx.$executeRaw`
        UPDATE "sectors"
        SET "availableCapacity" = "availableCapacity" - ${quantity}
        WHERE id = ${sectorId} AND "availableCapacity" >= ${quantity}
      `;

      if (updateResult === 0) {
        throw new Error("CONFLICT");
      }

      // 3. Cria a Reserva
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      const res = await tx.reservation.create({
        data: {
          userId: session.id,
          eventId: sector.eventId,
          status: "PENDING",
          expiresAt,
          items: {
            create: {
              sectorId: sector.id,
              quantity,
              unitPrice: sector.price,
            },
          },
        },
        include: {
          items: true,
        },
      });

      return res;
    });

    const item = reservation.items[0];

    return NextResponse.json(
      {
        success: true,
        reservation: {
          id: reservation.id,
          sectorId,
          quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * quantity,
          expiresAt: reservation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
    }
    if (error.message === "INVALID_TYPE") {
      return NextResponse.json({ error: "Setor não é de pista (General Admission)" }, { status: 400 });
    }
    if (error.message === "CONFLICT") {
      return NextResponse.json({ error: "Vagas insuficientes no setor para a quantidade solicitada." }, { status: 409 });
    }

    console.error("[RESERVE_GA_ERROR]", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
