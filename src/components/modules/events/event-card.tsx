import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatShortDateRange } from "@/lib/utils/date-formatters";
import { getEventCategoryLabel } from "@/lib/constants/event-categories";
import { Calendar, MapPin } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string;
  eventDate: Date | string;
  endDate?: Date | string | null;
  locationName: string;
  city: string;
  bannerUrl: string | null;
  minPrice: number;
  category: string;
  isAdult?: boolean;
}

const MONTHS_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function EventCard({
  id,
  title,
  eventDate,
  endDate,
  locationName,
  city,
  bannerUrl,
  minPrice,
  category,
  isAdult,
}: EventCardProps) {
  const d = new Date(eventDate);
  const dayNumber = isNaN(d.getTime()) ? "--" : String(d.getDate()).padStart(2, "0");
  const monthAbbr = isNaN(d.getTime()) ? "---" : MONTHS_SHORT[d.getMonth()];

  const formattedDate = formatShortDateRange(eventDate, endDate);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(minPrice);

  return (
    <Link href={`/events/${id}`} className="group block h-full select-none">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface transition-all duration-200 hover:shadow-md hover:border-primary/40">
        
        {/* Banner com Selo de Data de Bilheteria */}
        <div className="relative aspect-video w-full overflow-hidden bg-bg-main">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-surface-hover text-text-muted text-xs">
              Sem Imagem
            </div>
          )}

          {/* Categoria & +18 no Topo Esquerdo */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 z-10">
            <Badge variant="neutral" className="bg-black/60 text-white backdrop-blur-md text-[10px] font-bold border-none">
              {getEventCategoryLabel(category)}
            </Badge>
            {isAdult && (
              <span 
                className="inline-flex items-center justify-center rounded-md bg-black px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 shadow-sm"
                title="Classificação indicativa: +18"
              >
                +18
              </span>
            )}
          </div>

          {/* Selo de Data de Bilheteria no Topo Direito */}
          <div className="absolute right-3 top-3 z-10 bg-bg-surface/95 text-text-primary backdrop-blur-md border border-border-subtle rounded-lg px-2 py-1 text-center shadow-sm">
            <span className="block font-mono text-base font-extrabold leading-none text-primary">
              {dayNumber}
            </span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
              {monthAbbr}
            </span>
          </div>
        </div>
        
        {/* Corpo do Card */}
        <div className="flex flex-1 flex-col p-4 justify-between">
          <div>
            <h3 className="line-clamp-2 text-base font-bold text-text-primary group-hover:text-primary transition-colors leading-snug">
              {title}
            </h3>

            <div className="mt-2 space-y-1 text-xs text-text-muted">
              <p className="flex items-center gap-1.5 line-clamp-1">
                <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <span>{formattedDate}</span>
              </p>
              <p className="flex items-center gap-1.5 line-clamp-1">
                <MapPin className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <span>{locationName} &bull; {city}</span>
              </p>
            </div>
          </div>
          
          {/* Rodapé do Bilhete com Divisor de Picote Tracejado */}
          <div className="relative mt-4 pt-3 border-t border-dashed border-border-subtle flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-text-muted">
                A partir de
              </span>
              <span className="font-mono text-base font-extrabold text-text-primary">
                {formattedPrice}
              </span>
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Ingressos <span aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}
