import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { SectorItem } from "@/components/modules/events/SectorItem";

type Params = Promise<{ id: string }>;

export default async function EventDetailsPage({ params }: { params: Params }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: {
      id,
    },
    include: {
      sectors: true,
      organizer: true,
    },
  });

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(event.eventDate);

  return (
    <div className="min-h-screen pb-16 bg-surface-hover">
      <div className="container mx-auto px-4 mt-8">
        {/* Hero Banner Card */}
        <div className="relative h-[350px] w-full sm:h-[450px] rounded-2xl overflow-hidden shadow-sm bg-main">
          {/* Fundo Borrado */}
          {event.bannerUrl ? (
            <div className="absolute inset-0">
              <Image
                src={event.bannerUrl}
                alt={`${event.title} (Fundo)`}
                fill
                className="object-cover blur-lg scale-110"
                priority
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-surface-hover" />
          )}
          
          {/* Gradiente para garantir legibilidade no Mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:hidden" />
          
          <div className="relative z-10 flex w-full h-full p-6 sm:p-10">
            {/* Textos (Esquerda) */}
            <div className="flex w-full sm:w-1/2 flex-col gap-4 justify-end sm:justify-center">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="neutral" className="w-fit bg-white/20 text-white backdrop-blur-md border-white/20">
                  {event.category}
                </Badge>
                {event.isAdult && (
                  <Badge variant="danger" className="w-fit bg-black text-white backdrop-blur-md border-danger font-bold text-xs">
                    +18
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-5xl lg:text-6xl drop-shadow-sm">
                {event.title}
              </h1>

              <div className="flex flex-col gap-3 sm:gap-6 sm:flex-row mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Data e Hora</p>
                    <p className="font-medium text-white">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Localização</p>
                    <p className="font-medium text-white">{event.locationName}, {event.city}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Imagem Original (Direita) */}
            {event.bannerUrl && (
              <div className="hidden sm:block relative w-1/2 h-full ml-auto">
                <Image
                  src={event.bannerUrl}
                  alt={event.title}
                  fill
                  className="object-contain drop-shadow-2xl rounded-xl w-fit"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto mt-18 px-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Sobre o Evento</h2>
            <p className="whitespace-pre-line text-text-muted leading-relaxed">
              {event.description}
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Localização</h2>
            <p className="font-medium text-text-primary">{event.locationName}</p>
            <p className="text-sm text-text-muted">{event.city}</p>
            
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.locationName}, ${event.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-sm ring-1 ring-shadow-sm bg-transparent hover:bg-surface text-text-primary w-fit"
            >
              <MapPin className="h-4 w-4" />
              Abrir no Google Maps
            </a>
          </section>

          <section className="rounded-xl shadow-sm bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-surface-hover shadow-sm flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-text-muted">{event.organizer.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold text-text-primary">{event.organizer.name}</p>
                <p className="text-sm text-text-muted">Organizador do evento</p>
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar Info (Right Column) */}
        <div className="space-y-6">
          <div className="rounded-xl shadow-sm bg-surface p-6 sticky top-6">
            <h3 className="text-xl font-bold text-text-primary mb-6">Selecionar Ingressos</h3>
            
            <div className="space-y-4">
              <div className="divide-y divide-subtle">
                {event.sectors.map((sector) => (
                  <SectorItem key={sector.id} sector={sector} eventId={event.id} />
                ))}
                {event.sectors.length === 0 && (
                  <div className="py-4 text-center text-sm text-text-muted">
                    Nenhum setor cadastrado para este evento.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
