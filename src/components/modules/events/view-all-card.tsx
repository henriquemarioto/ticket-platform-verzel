import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

interface ViewAllCardProps {
  href: string;
  title?: string;
  subtitle?: string;
  count?: number;
  className?: string;
  variant?: "grid" | "carousel";
}

export function ViewAllCard({
  href,
  title = "Ver todos os eventos",
  subtitle = "Explore todo o catálogo",
  count,
  className = "",
  variant = "grid",
}: ViewAllCardProps) {
  const isCarousel = variant === "carousel";

  return (
    <Link
      href={href}
      className={`group block h-full ${
        isCarousel ? "w-[260px] sm:w-[280px] shrink-0 snap-start" : ""
      } ${className}`}
    >
      <article className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle bg-surface p-6 text-center shadow-sm transition-all duration-200 hover:border-primary hover:bg-surface-hover hover:shadow-md hover:ring-2 hover:ring-primary/20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          <Compass className="h-7 w-7" />
        </div>
        
        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="mt-1 text-sm text-text-muted">
          {subtitle}
        </p>

        {typeof count === "number" && count > 0 && (
          <span className="mt-2 inline-flex items-center rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-text-muted">
            {count} {count === 1 ? "evento disponível" : "eventos disponíveis"}
          </span>
        )}

        <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
          <span>Acessar agora</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </article>
    </Link>
  );
}
