import { prisma } from "@/lib/prisma";
import { EventSearchBar } from "@/components/modules/events/event-search-bar";
import { CategoryPills } from "@/components/modules/events/category-pills";
import { EventCard } from "@/components/modules/events/event-card";
import { AdvancedFiltersDrawer } from "@/components/modules/events/advanced-filters-drawer";
import { ActiveFilterChips } from "@/components/modules/events/active-filter-chips";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EventsCatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined;
  const categoriesParam = typeof resolvedSearchParams.categories === "string" ? resolvedSearchParams.categories : undefined;
  const city = typeof resolvedSearchParams.city === "string" ? resolvedSearchParams.city : undefined;
  const minPrice = typeof resolvedSearchParams.minPrice === "string" ? parseFloat(resolvedSearchParams.minPrice) : undefined;
  const maxPrice = typeof resolvedSearchParams.maxPrice === "string" ? parseFloat(resolvedSearchParams.maxPrice) : undefined;
  const startDate = typeof resolvedSearchParams.startDate === "string" ? new Date(resolvedSearchParams.startDate) : undefined;
  const endDate = typeof resolvedSearchParams.endDate === "string" ? new Date(resolvedSearchParams.endDate) : undefined;
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : "date_asc";

  const categoriesArray = categoriesParam ? categoriesParam.split(",") : (category ? [category] : undefined);

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(startDate || endDate ? {
        eventDate: {
          ...(startDate ? { gte: startDate } : { gte: new Date() }),
          ...(endDate ? { lte: endDate } : {}),
        }
      } : { eventDate: { gte: new Date() } }),
      ...(query && {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { locationName: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      }),
      ...(categoriesArray && categoriesArray.length > 0 && {
        category: { in: categoriesArray as import("@prisma/client").EventCategory[] },
      }),
      ...(city && {
        city: { contains: city, mode: "insensitive" }
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        sectors: {
          some: {
            price: {
              ...(minPrice !== undefined && !isNaN(minPrice) && { gte: minPrice }),
              ...(maxPrice !== undefined && !isNaN(maxPrice) && { lte: maxPrice }),
            }
          }
        }
      }),
    },
    include: {
      sectors: true,
    },
  });

  // Calculate minPrice and sort in memory
  const formattedEvents = events.map((event) => {
    const minPriceVal =
      event.sectors.length > 0
        ? Math.min(...event.sectors.map((s) => s.price))
        : 0;
    return { ...event, minPrice: minPriceVal };
  });

  formattedEvents.sort((a, b) => {
    if (sort === "price_asc") return a.minPrice - b.minPrice;
    if (sort === "price_desc") return b.minPrice - a.minPrice;
    if (sort === "title_asc") return a.title.localeCompare(b.title);
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
  });

  return (
    <div className="min-h-screen pb-16 pt-8">
      <main className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Explorar Eventos</h1>
            <p className="mt-1 text-text-muted">
              {formattedEvents.length} {formattedEvents.length === 1 ? "evento encontrado" : "eventos encontrados"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <EventSearchBar />
            <AdvancedFiltersDrawer />
            <CategoryPills />
          </div>
          
          <div className="pt-2">
            <ActiveFilterChips />
          </div>
        </div>

        {/* Results Grid */}
        {formattedEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {formattedEvents.map((event) => {
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
                  minPrice={event.minPrice}
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
