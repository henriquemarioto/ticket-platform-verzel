"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const currentCategory = searchParams.get("category") || "";

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {CATEGORIES.map((category) => {
        const isActive = currentCategory === category.value;
        const href = category.value ? `/events?category=${category.value}` : "/";
        
        return (
          <Link key={category.value} href={href} prefetch={true}>
            <Badge
              variant={isActive ? "success" : "neutral"}
              className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                isActive ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "hover:bg-surface-hover"
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
