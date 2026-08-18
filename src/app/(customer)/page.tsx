import { prisma } from "@/lib/prisma";
import { EventSearchBar } from "@/components/modules/events/event-search-bar";
import { CategoryPills } from "@/components/modules/events/category-pills";
import { EventCard } from "@/components/modules/events/event-card";
import { EventCarousel } from "@/components/modules/events/event-carousel";
import { ViewAllCard } from "@/components/modules/events/view-all-card";

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

  const featuredEvents = allEvents.slice(0, 7);

  const shows = allEvents.filter((e) => e.category === "SHOW");
  const movies = allEvents.filter((e) => e.category === "MOVIE");
  const theaters = allEvents.filter((e) => e.category === "THEATER");
  const festivals = allEvents.filter((e) => e.category === "FESTIVAL");

  const renderEventCard = (event: typeof allEvents[0]) => {
    const minPrice =
      event.sectors.length > 0
        ? Math.min(...event.sectors.map((s) => s.price))
        : 0;

    return (
      <div key={event.id} className="w-[260px] sm:w-[280px] shrink-0 snap-start h-auto">
        <EventCard
          id={event.id}
          title={event.title}
          eventDate={event.eventDate}
          locationName={event.locationName}
          city={event.city}
          bannerUrl={event.bannerUrl}
          minPrice={minPrice}
          category={event.category}
        />
      </div>
    );
  };

  const renderGridEventCard = (event: typeof allEvents[0]) => {
    const minPrice =
      event.sectors.length > 0
        ? Math.min(...event.sectors.map((s) => s.price))
        : 0;

    return (
      <EventCard
        key={event.id}
        id={event.id}
        title={event.title}
        eventDate={event.eventDate}
        locationName={event.locationName}
        city={event.city}
        bannerUrl={event.bannerUrl}
        minPrice={minPrice}
        category={event.category}
      />
    );
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="relative flex min-h-[300px] flex-col items-center justify-center bg-surface-hover px-4 py-16 text-center sm:min-h-[400px]">
        <div className="absolute inset-0 bg-main/50" />
        <div className="relative z-10 mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Sua próxima experiência começa aqui
          </h1>
          <p className="text-lg text-text-muted sm:text-xl">
            Descubra shows, teatros, cinemas e festivais imperdíveis acontecendo perto de você.
          </p>
          <div className="pt-4 flex flex-col items-center gap-6">
            <EventSearchBar />
            <CategoryPills />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto mt-8 px-4 sm:mt-12 space-y-16">
        
        {/* Eventos em Destaque (Grade 2 Fileiras) */}
        <section>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-text-primary">Eventos em Destaque</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredEvents.map(renderGridEventCard)}
            <ViewAllCard 
              href="/events" 
              count={allEvents.length} 
              variant="grid" 
            />
          </div>
        </section>

        {/* Carrossel de Shows */}
        {shows.length > 0 && (
          <EventCarousel title="Shows & Concertos" categoryLabel="Música ao vivo">
            {shows.slice(0, 8).map(renderEventCard)}
            <ViewAllCard 
              href="/events?category=SHOW" 
              title="Ver todos os Shows"
              subtitle="Encontre mais atrações musicais"
              count={shows.length} 
              variant="carousel" 
            />
          </EventCarousel>
        )}

        {/* Carrossel de Teatro */}
        {theaters.length > 0 && (
          <EventCarousel title="Teatro & Espetáculos" categoryLabel="Artes Cênicas">
            {theaters.slice(0, 8).map(renderEventCard)}
            <ViewAllCard 
              href="/events?category=THEATER" 
              title="Ver todos de Teatro"
              subtitle="Mais peças e apresentações"
              count={theaters.length} 
              variant="carousel" 
            />
          </EventCarousel>
        )}

        {/* Carrossel de Cinema */}
        {movies.length > 0 && (
          <EventCarousel title="Cinema & Filmes" categoryLabel="Nas telonas">
            {movies.slice(0, 8).map(renderEventCard)}
            <ViewAllCard 
              href="/events?category=MOVIE" 
              title="Ver todos de Cinema"
              subtitle="Mais filmes em cartaz"
              count={movies.length} 
              variant="carousel" 
            />
          </EventCarousel>
        )}

        {/* Carrossel de Festivais */}
        {festivals.length > 0 && (
          <EventCarousel title="Festivais" categoryLabel="Para curtir o dia todo">
            {festivals.slice(0, 8).map(renderEventCard)}
            <ViewAllCard 
              href="/events?category=FESTIVAL" 
              title="Ver todos os Festivais"
              subtitle="Mais eventos de longa duração"
              count={festivals.length} 
              variant="carousel" 
            />
          </EventCarousel>
        )}
      </main>
    </div>
  );
}
