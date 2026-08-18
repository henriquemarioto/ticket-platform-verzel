import { prisma } from "@/lib/prisma";
import { EventSearchBar } from "@/components/modules/events/event-search-bar";
import { CategoryPills } from "@/components/modules/events/category-pills";
import { EventCard } from "@/components/modules/events/event-card";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined;

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      eventDate: {
        gte: new Date(),
      },
      ...(query && {
        title: {
          contains: query,
          mode: "insensitive",
        },
      }),
      ...(category && {
        category: category as import("@prisma/client").EventCategory,
      }),
    },
    include: {
      sectors: true,
    },
    orderBy: {
      eventDate: "asc",
    },
  });

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
          <div className="pt-4 flex justify-center">
            <EventSearchBar />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto mt-8 px-4 sm:mt-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Eventos em Destaque</h2>
          <CategoryPills />
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {events.map((event) => {
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
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-surface-hover p-4">
              <svg
                className="h-10 w-10 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary">Nenhum evento encontrado</h3>
            <p className="mt-2 text-text-muted">
              Não encontramos eventos com os filtros selecionados.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
