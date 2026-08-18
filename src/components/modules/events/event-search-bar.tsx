"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EventSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentQ = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(currentQ);
  const [prevQ, setPrevQ] = useState(currentQ);

  if (prevQ !== currentQ) {
    setPrevQ(currentQ);
    setSearchTerm(currentQ);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = searchTerm.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      
      const newQuery = params.toString();
      const currentQuery = searchParams.toString();
      
      if (newQuery !== currentQuery) {
        // If we are on home and searching, go to /events. Otherwise keep current path.
        const basePath = pathname === "/" && newQuery ? "/events" : pathname;
        const newUrl = newQuery ? `${basePath}?${newQuery}` : basePath;
        router.replace(newUrl, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, searchParams, pathname, router]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute z-10 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
