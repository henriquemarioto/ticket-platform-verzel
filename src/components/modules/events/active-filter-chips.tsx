"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filters = [
    { key: "category", label: "Categoria", value: searchParams.get("category") },
    { key: "minPrice", label: "Min R$", value: searchParams.get("minPrice") },
    { key: "maxPrice", label: "Max R$", value: searchParams.get("maxPrice") },
    { key: "city", label: "Cidade", value: searchParams.get("city") },
  ].filter(f => f.value);

  if (filters.length === 0 && !searchParams.get("startDate") && !searchParams.get("endDate")) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center mt-4">
      <span className="text-sm text-text-muted mr-2">Filtros ativos:</span>
      {filters.map((f) => (
        <Badge key={f.key} variant="neutral" className="flex items-center gap-1 bg-surface-hover">
          {f.label}: {f.value}
          <button onClick={() => removeFilter(f.key)} className="ml-1 hover:text-danger focus:outline-none cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {(searchParams.get("startDate") || searchParams.get("endDate")) && (
        <Badge variant="neutral" className="flex items-center gap-1 bg-surface-hover">
          Data: {searchParams.get("startDate") || "..."} até {searchParams.get("endDate") || "..."}
          <button onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("startDate");
            params.delete("endDate");
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }} className="ml-1 hover:text-danger focus:outline-none cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      
      <button 
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          ['category', 'minPrice', 'maxPrice', 'city', 'startDate', 'endDate'].forEach(k => params.delete(k));
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }}
        className="text-xs text-primary hover:underline ml-2 cursor-pointer"
      >
        Limpar todos
      </button>
    </div>
  );
}
