import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createTemporaryGatekeeperSchema } from "@/lib/validations/gatekeeper-management";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateRandomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pwd = "Gate#";
  for (let i = 0; i < 4; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

function generateRandomEmail(eventTitle: string): string {
  const cleanTitle = eventTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const randomSuffix = crypto.randomBytes(2).toString("hex");
  return `portaria-${cleanTitle}-${randomSuffix}@verzel.com.br`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");

    const userId = session?.id || userIdHeader;
    const userRole = session?.role || roleHeader;

    if (!userId || userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas organizadores podem gerenciar portaria." },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        gatekeepers: {
          include: {
            gatekeeper: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para gerenciar a portaria deste evento." },
        { status: 403 }
      );
    }

    const gatekeepers = event.gatekeepers.map((eg) => ({
      id: eg.gatekeeper.id,
      name: eg.gatekeeper.name,
      email: eg.gatekeeper.email,
      assignedAt: eg.createdAt,
    }));

    return NextResponse.json({
      success: true,
      gatekeepers,
    });
  } catch (error: unknown) {
    console.error("Erro ao listar portaria do evento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao listar portaria." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");

    const userId = session?.id || userIdHeader;
    const userRole = session?.role || roleHeader;

    if (!userId || userRole !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas organizadores podem criar contas de portaria." },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para adicionar portaria a este evento." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = createTemporaryGatekeeperSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, autoGenerate } = validation.data;
    let email = validation.data.email?.trim();
    let rawPassword = validation.data.password?.trim();

    if (autoGenerate || !email) {
      email = generateRandomEmail(event.title);
    }

    if (autoGenerate || !rawPassword) {
      rawPassword = generateRandomPassword();
    }

    // Verificar se e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Se já existe e é portaria, apenas vincular ao evento
      if (existingUser.role === "GATEKEEPER") {
        const existingLink = await prisma.eventGatekeeper.findUnique({
          where: {
            eventId_gatekeeperId: {
              eventId: event.id,
              gatekeeperId: existingUser.id,
            },
          },
        });

        if (existingLink) {
          return NextResponse.json(
            { error: "Este operador de portaria já está vinculado ao evento." },
            { status: 409 }
          );
        }

        await prisma.eventGatekeeper.create({
          data: {
            eventId: event.id,
            gatekeeperId: existingUser.id,
          },
        });

        return NextResponse.json(
          {
            success: true,
            gatekeeper: {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              assignedAt: new Date().toISOString(),
            },
          },
          { status: 201 }
        );
      } else {
        return NextResponse.json(
          { error: "O e-mail informado pertence a um usuário que não é operador de portaria." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "GATEKEEPER",
        },
      });

      const eventLink = await tx.eventGatekeeper.create({
        data: {
          eventId: event.id,
          gatekeeperId: newUser.id,
        },
      });

      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        assignedAt: eventLink.createdAt.toISOString(),
        generatedPassword: rawPassword,
      };
    });

    return NextResponse.json(
      {
        success: true,
        gatekeeper: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erro ao criar conta de portaria temporária:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar conta de portaria." },
      { status: 500 }
    );
  }
}
