import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { processCheckout } from "@/services/checkout.service";
import { handleApiError } from "@/services/errors";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await processCheckout({
      ...parsed.data,
      customerId: session.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "CheckoutProcessRoute", "Erro ao processar o checkout");
  }
}
