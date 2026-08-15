import { NextRequest, NextResponse } from "next/server";
import { ticketmasterMocks } from "@/lib/external/catalog-mocks";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");

    if (role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, error: "Acesso negado. Apenas organizadores podem buscar no catálogo." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: "O parâmetro 'keyword' é obrigatório." },
        { status: 400 }
      );
    }

    const apiKey = process.env.TICKETMASTER_API_KEY;

    // Fallback para mock se a chave não estiver configurada
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        provider: "TICKETMASTER_MOCK",
        results: ticketmasterMocks.filter(mock => mock.title.toLowerCase().includes(keyword.toLowerCase())),
      });
    }

    // Faz a chamada real para a Ticketmaster Discovery API
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(keyword)}&size=10&apikey=${apiKey}`;
    const response = await fetch(ticketmasterUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Ticketmaster API Error:", response.statusText);
      throw new Error(`Falha na comunicação com o serviço externo Ticketmaster: ${response.status}`);
    }

    const data = await response.json();

    const events = data._embedded?.events || [];

    const normalizedResults = events.map((event: any) => {
      // Priorizar imagens 16:9 de alta resolução (>1000px)
      const bestImage = event.images?.filter((img: any) => img.ratio === "16_9" && img.width > 1000)
        .sort((a: any, b: any) => b.width - a.width)[0] 
        || event.images?.[0]; // Fallback pra primeira

      const venue = event._embedded?.venues?.[0];
      const location = venue ? `${venue.name}, ${venue.city?.name}` : "Local a definir";

      return {
        externalId: `tm_${event.id}`,
        title: event.name,
        genre: event.classifications?.[0]?.genre?.name || "Música",
        bannerUrl: bestImage?.url || null,
        category: "SHOW",
        suggestedLocation: location
      };
    });

    return NextResponse.json({
      success: true,
      provider: "TICKETMASTER",
      results: normalizedResults,
    });

  } catch (error) {
    console.warn("Retornando fallback Ticketmaster devido a erro na API:", error);
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "";

    return NextResponse.json({
      success: true,
      provider: "TICKETMASTER_MOCK",
      results: ticketmasterMocks.filter(mock => mock.title.toLowerCase().includes(keyword.toLowerCase())),
    });
  }
}
