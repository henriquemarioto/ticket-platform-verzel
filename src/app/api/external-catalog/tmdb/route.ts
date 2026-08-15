import { NextRequest, NextResponse } from "next/server";
import { tmdbMocks } from "@/lib/external/catalog-mocks";

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
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "O parâmetro 'query' é obrigatório." },
        { status: 400 }
      );
    }

    const apiKey = process.env.TMDB_API_KEY;

    // Fallback para mock se a chave não estiver configurada
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        provider: "TMDB_MOCK",
        page: 1,
        totalResults: tmdbMocks.length,
        results: tmdbMocks.filter(mock => mock.title.toLowerCase().includes(query.toLowerCase()) || mock.originalTitle.toLowerCase().includes(query.toLowerCase())),
      });
    }

    // Faz a chamada real para a API do TMDb
    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&api_key=${apiKey}`;
    const response = await fetch(tmdbUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("TMDb API Error:", response.statusText);
      // Se houver erro HTTP (ex: 429 ou 5xx), cai no fallback também
      throw new Error(`Falha na comunicação com o serviço externo TMDb: ${response.status}`);
    }

    const data = await response.json();

    const normalizedResults = data.results.map((movie: any) => ({
      externalId: `tmdb_${movie.id}`,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      releaseDate: movie.release_date,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null,
      backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
      category: "MOVIE",
    }));

    return NextResponse.json({
      success: true,
      provider: "TMDB",
      page: data.page,
      totalResults: data.total_results,
      results: normalizedResults,
    });

  } catch (error) {
    console.warn("Retornando fallback TMDB devido a erro na API:", error);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    return NextResponse.json({
      success: true,
      provider: "TMDB_MOCK",
      page: 1,
      totalResults: tmdbMocks.length,
      results: tmdbMocks.filter(mock => mock.title.toLowerCase().includes(query.toLowerCase()) || mock.originalTitle.toLowerCase().includes(query.toLowerCase())),
    });
  }
}
