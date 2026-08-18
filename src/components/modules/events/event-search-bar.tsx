"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EventSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      
      const newQuery = params.toString();
      const currentQuery = searchParams.toString();
      
      if (newQuery !== currentQuery) {
        const newUrl = newQuery ? `/?${newQuery}` : "/";
        router.replace(newUrl, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, searchParams, router]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5" aria-hidden="true" />
      </div>
      <Input
        type="search"
        className="pl-10"
        placeholder="Buscar eventos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Buscar eventos"
      />
    </div>
  );
}
