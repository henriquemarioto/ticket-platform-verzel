import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  id: string;
  title: string;
  eventDate: Date;
  locationName: string;
  city: string;
  bannerUrl: string | null;
  minPrice: number;
  category: string;
  isAdult?: boolean;
}

export function EventCard({
  id,
  title,
  eventDate,
  locationName,
  city,
  bannerUrl,
  minPrice,
  category,
  isAdult,
}: EventCardProps) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(eventDate);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(minPrice);

  return (
    <Link href={`/events/${id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 bg-surface transition-all duration-200 hover:shadow-md hover:ring-primary/50">
        <div className="relative aspect-video w-full overflow-hidden bg-main">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-hover text-text-muted">
              Sem Imagem
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <Badge variant="neutral" className="bg-black/60 text-white backdrop-blur-md">
              {category}
            </Badge>
            {isAdult && (
              <span 
                className="inline-flex items-center justify-center rounded-md bg-black px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border shadow-sm"
                title="Classificação indicativa: +18"
              >
                +18
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-lg font-bold text-text-primary group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {formattedDate}
          </p>
          <p className="mt-1 text-sm text-text-muted line-clamp-1">
            {locationName} • {city}
          </p>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="text-xs text-text-muted">A partir de</span>
            <span className="text-lg font-bold text-primary">{formattedPrice}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
