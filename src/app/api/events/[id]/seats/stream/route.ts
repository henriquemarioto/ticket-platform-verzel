import { NextRequest, NextResponse } from "next/server";
import { subscribeToSeatEvents, SeatEvent } from "@/lib/seat-events";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ error: "O ID do evento é obrigatório" }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Envia mensagem inicial
        controller.enqueue(encoder.encode(": connected\n\n"));

        // Inscreve no canal do evento
        const unsubscribe = subscribeToSeatEvents(eventId, (event: SeatEvent) => {
          try {
            const payload = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch (err) {
            console.error("[SSE Stream] Erro ao enviar evento de assento:", err);
          }
        });

        // Configura heartbeat periódico a cada 20 segundos
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch (err) {
            clearInterval(pingInterval);
            unsubscribe();
          }
        }, 20000);

        // Trata desconexão do cliente
        request.signal.addEventListener("abort", () => {
          clearInterval(pingInterval);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // Stream já encerrado
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[SSE Stream Route Error]", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
