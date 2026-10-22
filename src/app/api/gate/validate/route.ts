import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validateTicketSchema } from "@/lib/validations/gate";
import { validateGateTicket } from "@/services/gate.service";
import { handleApiError } from "@/services/errors";

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

    const validationResult = await validateGateTicket({
      gatekeeperId: session.id,
      eventId,
      qrPayload,
      ticketCode,
    });

    return NextResponse.json(validationResult);
  } catch (error) {
    return handleApiError(error, "GateValidateRoute", "Erro interno ao validar ingresso");
  }
}
