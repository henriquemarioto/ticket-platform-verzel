import { prisma } from "@/lib/prisma";
import { EventSearchBar } from "@/components/modules/events/event-search-bar";
import { CategoryPills } from "@/components/modules/events/category-pills";
import { EventCard } from "@/components/modules/events/event-card";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EventsCatalogPage({
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
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { locationName: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
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
    <div className="min-h-screen pb-16 pt-8">
      <main className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Explorar Eventos</h1>
              <p className="mt-1 text-text-muted">
                {events.length} {events.length === 1 ? "evento encontrado" : "eventos encontrados"}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <EventSearchBar />
            </div>
          </div>
          
          <div className="pt-2">
            <CategoryPills />
          </div>
        </div>

        {/* Results Grid */}
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
                  endDate={event.endDate}
                  locationName={event.locationName}
                  city={event.city}
                  bannerUrl={event.bannerUrl}
                  minPrice={minPrice}
                  category={event.category}
                  isAdult={event.isAdult}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface-hover py-24 text-center">
            <div className="mb-4 rounded-full bg-surface p-4 shadow-sm ring-1 ring-black/5">
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
            <p className="mt-2 max-w-sm text-text-muted">
              Não encontramos eventos com os filtros selecionados. Tente buscar por outros termos ou limpar as categorias.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
