"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Music, Film, Drama, PartyPopper } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Todos", icon: "" },
  { value: "SHOW", label: "Shows", icon: Music },
  { value: "MOVIE", label: "Cinema", icon: Film },
  { value: "THEATER", label: "Teatro", icon: Drama },
  { value: "FESTIVAL", label: "Festivais", icon: PartyPopper },
];

export function CategoryPills() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentCategory = searchParams.get("category") || "";

  const getCategoryHref = (catValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catValue) {
      params.set("category", catValue);
    } else {
      params.delete("category");
    }
    const queryString = params.toString();
    if (pathname === "/" && !catValue && !params.get("q")) {
      return "/";
    }
    return queryString ? `/events?${queryString}` : "/events";
  };

  return (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por categoria">
      {CATEGORIES.map((category) => {
        const isActive = currentCategory === category.value;
        const href = getCategoryHref(category.value);
        const Icon = category.icon;
        
        return (
          <Link key={category.value} href={href} prefetch={true}>
            <Badge
              variant={isActive ? "success" : "neutral"}
              className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 border select-none inline-flex items-center ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary-hover shadow-sm font-semibold active:scale-95"
                  : "bg-surface text-text-muted border-border-subtle hover:bg-surface-hover hover:text-text-primary hover:border-primary/40 hover:shadow-xs active:scale-95"
              }`}
            >
              {category.icon ? ( 
                <Icon className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : null}
              <span>{category.label}</span>
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
