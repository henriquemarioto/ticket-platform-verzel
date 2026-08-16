import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket } from "lucide-react";
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

  const hasAvailableCapacity = event.sectors.some((s) => s.availableCapacity > 0);

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner */}
      <div className="relative h-[300px] w-full bg-main sm:h-[450px]">
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-surface-hover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-main to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10">
          <div className="container mx-auto">
            <Badge variant="neutral" className="mb-4 bg-white/10 text-white backdrop-blur-md border-white/20">
              {event.category}
            </Badge>
            <h1 className="text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto mt-8 px-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-subtle bg-surface p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Sobre o Evento</h2>
            <p className="whitespace-pre-line text-text-muted leading-relaxed">
              {event.description}
            </p>
          </section>

          <section id="setores" className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">Setores e Ingressos</h2>
            
            <div className="overflow-hidden rounded-xl border border-subtle bg-surface">
              <div className="divide-y divide-subtle">
                {event.sectors.map((sector) => (
                  <SectorItem key={sector.id} sector={sector} eventId={event.id} />
                ))}
                {event.sectors.length === 0 && (
                  <div className="p-8 text-center text-text-muted">
                    Nenhum setor cadastrado para este evento.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-subtle bg-surface p-6 sticky top-6">
            <h3 className="text-lg font-bold text-text-primary mb-6">Detalhes</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Data e Hora</p>
                  <p className="text-sm text-text-muted">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Localização</p>
                  <p className="text-sm text-text-muted">{event.locationName}</p>
                  <p className="text-sm text-text-muted">{event.city}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-subtle">
              {hasAvailableCapacity ? (
                <a 
                  href="#setores"
                  className="w-full h-12 text-lg font-medium inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Comprar Ingressos
                </a>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full h-12 text-lg font-medium"
                  disabled={true}
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Esgotado
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
