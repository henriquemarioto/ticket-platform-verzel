import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { EventSearchBar } from "@/components/modules/events/event-search-bar";
import { CategoryPills } from "@/components/modules/events/category-pills";
import { EventCard } from "@/components/modules/events/event-card";
import { EventCarousel } from "@/components/modules/events/event-carousel";
import { ViewAllCard } from "@/components/modules/events/view-all-card";
import { TypewriterText, type TypewriterPhraseItem } from "@/components/ui/typewriter-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEventCategoryLabel } from "@/lib/constants/event-categories";
import { formatShortDateRange } from "@/lib/utils/date-formatters";
import { Calendar, MapPin, Ticket } from "lucide-react";

// Paleta harmônica editorial da marca (Action Blue, Purple, Deep Slate, Indigo)
const HERO_TYPEWRITER_PHRASES: TypewriterPhraseItem[] = [
  { prefix: "Seu próximo ", highlight: "show ao vivo", highlightColor: "text-primary", suffix: " começa aqui." },
  { prefix: "Sua próxima ", highlight: "peça de teatro", highlightColor: "text-secondary", suffix: " começa aqui." },
  { prefix: "Sua próxima ", highlight: "sessão de cinema", highlightColor: "text-[#0f4ccf]", suffix: " começa aqui." },
  { prefix: "Seu próximo ", highlight: "grande festival", highlightColor: "text-[#5b21b6]", suffix: " começa aqui." },
  { prefix: "Sua melhor ", highlight: "experiência cultural", highlightColor: "text-primary", suffix: " começa aqui." },
];

export default async function CustomerHomePage() {
  const allEvents = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      eventDate: {
        gte: new Date(),
      },
    },
    include: {
      sectors: true,
    },
    orderBy: {
      eventDate: "asc",
    },
  });

  const featured = allEvents[0] || null;
  const gridEvents = allEvents.slice(0, 8);

  const shows = allEvents.filter((e) => e.category === "SHOW");
  const movies = allEvents.filter((e) => e.category === "MOVIE");
  const theaters = allEvents.filter((e) => e.category === "THEATER");
  const festivals = allEvents.filter((e) => e.category === "FESTIVAL");

  const getMinPrice = (event: typeof allEvents[0]) => {
    return event.sectors.length > 0
      ? Math.min(...event.sectors.map((s) => s.price))
      : 0;
  };

  const renderEventCard = (event: typeof allEvents[0]) => {
    return (
      <div key={event.id} className="w-[260px] sm:w-[280px] shrink-0 snap-start h-auto">
        <EventCard
          id={event.id}
          title={event.title}
          eventDate={event.eventDate}
          endDate={event.endDate}
          locationName={event.locationName}
          city={event.city}
          bannerUrl={event.bannerUrl}
          minPrice={getMinPrice(event)}
          category={event.category}
          isAdult={event.isAdult}
        />
      </div>
    );
  };

  const renderGridEventCard = (event: typeof allEvents[0]) => {
    return (
      <EventCard
        key={event.id}
        id={event.id}
        title={event.title}
        eventDate={event.eventDate}
        endDate={event.endDate}
        locationName={event.locationName}
        city={event.city}
        bannerUrl={event.bannerUrl}
        minPrice={getMinPrice(event)}
        category={event.category}
        isAdult={event.isAdult}
      />
    );
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section Editorial Assimétrico de Bilheteria */}
      <section className="relative overflow-hidden bg-editorial-grid border-b border-border-subtle py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Coluna Esquerda: Curadoria & Busca (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>TEMPORADA 2026 &bull; BILHETERIA OFICIAL VERZEL</span>
              </div>

              {/* Título com Typewriter */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-tight min-h-[72px] sm:min-h-[96px] flex items-center">
                <TypewriterText
                  phrases={HERO_TYPEWRITER_PHRASES}
                  typingSpeed={60}
                  deletingSpeed={35}
                  pauseDuration={2400}
                  pauseBetweenPhrases={160}
                  className="text-left"
                />
              </h1>

              <p className="text-base sm:text-lg text-text-muted max-w-xl leading-relaxed">
                Emissão criptográfica imediata de ingressos com reserva atômica em tempo real, prevenção matemática contra double-booking e controle de portaria por WebRTC.
              </p>

              {/* Painel Estruturado de Busca e Filtros */}
              <div className="pt-2 flex flex-col gap-4">
                <div className="max-w-md">
                  <EventSearchBar />
                </div>
                <div className="pt-1">
                  <CategoryPills />
                </div>
              </div>
            </div>

            {/* Coluna Direita: Card "Featured Pass" de Bilheteria (5 cols) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              {featured ? (
                <div className="w-full max-w-md ticket-card-surface rounded-2xl overflow-hidden shadow-lg border border-border-subtle relative group">
                  {/* Cabeçalho do Canhoto de Bilhete */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-bg-surface-hover/80 border-b border-border-subtle text-xs font-mono">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      FEATURED PASS // Nº 001
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="neutral" className="text-[10px] uppercase font-bold tracking-wider">
                        {getEventCategoryLabel(featured.category)}
                      </Badge>
                      {featured.isAdult && (
                        <span className="px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-bold">
                          +18
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Banner do Evento */}
                  <div className="relative aspect-video w-full overflow-hidden bg-bg-main">
                    {featured.bannerUrl ? (
                      <Image
                        src={featured.bannerUrl}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        Sem Imagem
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-lg font-bold line-clamp-1 drop-shadow-sm">
                        {featured.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-200 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatShortDateRange(featured.eventDate, featured.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Linha Divisória de Picote com Entalhes Semicirculares */}
                  <div className="relative my-0 py-3 bg-bg-surface">
                    <div className="border-t border-dashed border-border-subtle" />
                    {/* Entalhes circulares de ingresso nas bordas */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bg-main border border-border-subtle" />
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bg-main border border-border-subtle" />
                  </div>

                  {/* Rodapé do Canhoto de Bilhete */}
                  <div className="px-5 pb-5 pt-1 space-y-4 bg-bg-surface">
                    <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        {featured.locationName} &bull; {featured.city}
                      </span>
                      <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        LUGAR MARCADO
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          A partir de
                        </span>
                        <span className="font-mono text-xl font-extrabold text-text-primary">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(getMinPrice(featured))}
                        </span>
                      </div>

                      <Link href={`/events/${featured.id}`}>
                        <Button variant="primary" size="md" className="font-bold gap-1 shadow-sm">
                          Garantir Lugar &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md p-8 rounded-2xl border border-dashed border-border-subtle bg-bg-surface text-center">
                  <Ticket className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-text-primary">Temporada em Breve</p>
                  <p className="text-xs text-text-muted mt-1">Novas atrações serão anunciadas nesta semana.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Conteúdo Principal com Índices Editoriais */}
      <main className="container mx-auto mt-10 px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Seção 01: Agenda em Destaque */}
        <section>
          <div className="mb-6 flex flex-col gap-1 border-b border-border-subtle pb-4">
            <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
              01 // AGENDA EM DESTAQUE
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Eventos Recomendados</h2>
              <Link href="/events" className="text-xs font-mono font-bold text-primary hover:underline uppercase">
                Ver programação completa &rarr;
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {gridEvents.map(renderGridEventCard)}
            <ViewAllCard 
              href="/events" 
              count={allEvents.length} 
              variant="grid" 
            />
          </div>
        </section>

        {/* Seção 02: Carrossel de Shows */}
        {shows.length > 0 && (
          <section>
            <div className="mb-2">
              <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
                02 // MÚSICA AO VIVO
              </span>
            </div>
            <EventCarousel title="Shows & Concertos" categoryLabel="Grandes turnês e apresentações musicais">
              {shows.slice(0, 8).map(renderEventCard)}
              <ViewAllCard 
                href="/events?category=SHOW" 
                title="Ver todos os Shows"
                subtitle="Encontre mais atrações musicais"
                count={shows.length} 
                variant="carousel" 
              />
            </EventCarousel>
          </section>
        )}

        {/* Seção 03: Carrossel de Teatro */}
        {theaters.length > 0 && (
          <section>
            <div className="mb-2">
              <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
                03 // ARTES CÊNICAS
              </span>
            </div>
            <EventCarousel title="Teatro & Espetáculos" categoryLabel="Dramas, comédias e musicais em cartaz">
              {theaters.slice(0, 8).map(renderEventCard)}
              <ViewAllCard 
                href="/events?category=THEATER" 
                title="Ver todos de Teatro"
                subtitle="Mais peças e apresentações"
                count={theaters.length} 
                variant="carousel" 
              />
            </EventCarousel>
          </section>
        )}

        {/* Seção 04: Carrossel de Cinema */}
        {movies.length > 0 && (
          <section>
            <div className="mb-2">
              <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
                04 // CINEMA & TELONAS
              </span>
            </div>
            <EventCarousel title="Cinema & Filmes" categoryLabel="Estreias e festivais cinematográficos">
              {movies.slice(0, 8).map(renderEventCard)}
              <ViewAllCard 
                href="/events?category=MOVIE" 
                title="Ver todos de Cinema"
                subtitle="Mais filmes em cartaz"
                count={movies.length} 
                variant="carousel" 
              />
            </EventCarousel>
          </section>
        )}

        {/* Seção 05: Carrossel de Festivais */}
        {festivals.length > 0 && (
          <section>
            <div className="mb-2">
              <span className="font-mono text-xs font-bold text-primary tracking-wider uppercase">
                05 // GRANDES FESTIVAIS
              </span>
            </div>
            <EventCarousel title="Festivais" categoryLabel="Eventos de longa duração e múltiplos palcos">
              {festivals.slice(0, 8).map(renderEventCard)}
              <ViewAllCard 
                href="/events?category=FESTIVAL" 
                title="Ver todos os Festivais"
                subtitle="Mais eventos de longa duração"
                count={festivals.length} 
                variant="carousel" 
              />
            </EventCarousel>
          </section>
        )}
      </main>
    </div>
  );
}
