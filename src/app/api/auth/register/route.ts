import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "E-mail já está em uso" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role,
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectUrl = user.role === "ORGANIZER" ? "/organizer" : "/";

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        redirectUrl,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
