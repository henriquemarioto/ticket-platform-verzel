"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "SHOW", label: "Shows" },
  { value: "MOVIE", label: "Cinema" },
  { value: "THEATER", label: "Teatro" },
  { value: "FESTIVAL", label: "Festivais" },
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
        
        return (
          <Link key={category.value} href={href} prefetch={true}>
            <Badge
              variant={isActive ? "success" : "neutral"}
              className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 border select-none ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary-hover shadow-sm font-semibold active:scale-95"
                  : "bg-surface text-text-muted border-border-subtle hover:bg-surface-hover hover:text-text-primary hover:border-primary/40 hover:shadow-xs active:scale-95"
              }`}
            >
              {category.label}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
