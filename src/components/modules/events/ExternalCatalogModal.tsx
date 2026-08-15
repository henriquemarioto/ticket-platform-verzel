"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Search, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface CatalogItem {
  externalId: string;
  title: string;
  originalTitle?: string;
  overview?: string;
  releaseDate?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  category: "SHOW" | "MOVIE" | "THEATER" | "FESTIVAL";
  genre?: string;
  bannerUrl?: string | null;
  suggestedLocation?: string;
}

interface ExternalCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: "TMDB" | "TICKETMASTER";
  onSelect: (item: CatalogItem) => void;
}

export function ExternalCatalogModal({ isOpen, onClose, provider, onSelect }: ExternalCatalogModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const [results, setResults] = React.useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { warning, error } = useToast();

  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        let url = "";
        if (provider === "TMDB") {
          url = `/api/external-catalog/tmdb?query=${encodeURIComponent(debouncedSearchTerm)}`;
        } else {
          url = `/api/external-catalog/ticketmaster?keyword=${encodeURIComponent(debouncedSearchTerm)}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setResults(data.results || []);
          if (data.provider.includes("MOCK")) {
            warning("Exibindo resultados de teste (mock).");
          }
        } else {
          error(data.error || "Erro ao buscar resultados.");
        }
      } catch (err) {
        error("Não foi possível conectar ao servidor.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearchTerm, provider, warning, error]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={provider === "TMDB" ? "Buscar Filmes no TMDb" : "Buscar Shows na Ticketmaster"}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <Input
          placeholder={provider === "TMDB" ? "Digite o nome do filme..." : "Digite o nome do show ou artista..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          autoFocus
        />

        <div className="min-h-[300px] max-h-[400px] overflow-y-auto pr-2 flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-2 rounded-lg border border-border-subtle">
                <Skeleton className="h-24 w-16 rounded-md" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))
          ) : results.length > 0 ? (
            results.map((item) => {
              const image = provider === "TMDB" ? item.posterUrl : item.bannerUrl;
              return (
                <button
                  key={item.externalId}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="flex gap-4 p-3 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-surface-hover hover:border-primary/50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {image ? (
                    <img 
                      src={image} 
                      alt={item.title} 
                      className="h-24 w-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="h-24 w-16 bg-bg-main rounded-md flex items-center justify-center flex-shrink-0 text-text-muted">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <h3 className="font-semibold text-text-primary truncate">{item.title}</h3>
                    {item.releaseDate && (
                      <span className="text-xs text-text-muted mb-1">{new Date(item.releaseDate).getFullYear()}</span>
                    )}
                    {item.genre && (
                      <span className="text-xs text-text-muted mb-1">{item.genre}</span>
                    )}
                    {(item.overview || item.suggestedLocation) && (
                      <p className="text-sm text-text-muted line-clamp-2 mt-1">
                        {item.overview || item.suggestedLocation}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          ) : debouncedSearchTerm.trim() !== "" ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-text-muted text-sm text-center">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              Nenhum resultado encontrado para "{debouncedSearchTerm}".<br />
              Tente outro termo ou preencha manualmente.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-text-muted text-sm text-center">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              Digite para começar a buscar.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
