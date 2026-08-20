import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Determine redirect URL
    let redirectUrl = "/";
    if (user.role === "ORGANIZER") {
      redirectUrl = "/organizer/analytics";
    } else if (user.role === "GATEKEEPER") {
      redirectUrl = "/gatekeeper";
    } else if (body.returnUrl) {
      redirectUrl = body.returnUrl;
    }

    return NextResponse.json({ data: { user: { id: user.id, email: user.email, role: user.role }, redirectUrl } }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Erro de validação", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
