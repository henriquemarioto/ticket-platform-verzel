"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Calendar, MapPin, Ticket, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GatekeeperEvent } from "./types";

interface GatekeeperEventSelectorProps {
  events: GatekeeperEvent[];
  onSelectEvent: (event: GatekeeperEvent) => void;
}

export function GatekeeperEventSelector({
  events,
  onSelectEvent,
}: GatekeeperEventSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter((event) => {
    const term = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(term) ||
      event.locationName.toLowerCase().includes(term) ||
      event.city.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Seletor */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 shadow-sm ring-1 ring-primary/20 text-primary text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Painel Operacional de Portaria</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary">
          Qual evento você irá validar hoje?
        </h1>
        <p className="text-text-muted text-sm sm:text-base">
          Selecione o evento ativo para iniciar a conferência de ingressos e liberar o acesso dos participantes.
        </p>
      </div>

      {/* Barra de Busca Rápida */}
      {events.length > 0 && (
        <div className="max-w-md mx-auto">
          <Input
            placeholder="Buscar por nome do evento, local ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4 text-text-muted" />}
          />
        </div>
      )}

      {/* Lista de Eventos Disponíveis */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-bg-surface rounded-xl shadow-sm max-w-lg mx-auto p-6">
          <div className="w-12 h-12 rounded-xl bg-bg-surface-hover mx-auto flex items-center justify-center text-text-muted mb-3">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            Nenhum evento ativo no momento
          </h2>
          <p className="text-sm text-text-muted">
            Não há eventos publicados ou encerrados disponíveis para validação de portaria neste momento.
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-bg-surface rounded-xl shadow-sm max-w-lg mx-auto p-6">
          <p className="text-text-muted text-sm">
            Nenhum evento encontrado para o termo &ldquo;{searchTerm}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const formattedDate = new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(event.eventDate));

            const occupancyRate =
              event.totalSold > 0
                ? Math.round((event.totalCheckedIn / event.totalSold) * 100)
                : 0;

            return (
              <div
                key={event.id}
                className="bg-bg-surface shadow-sm rounded-xl overflow-hidden hover:shadow-sm ring-1 ring-primary/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                {/* Banner / Imagem de Capa */}
                {event.bannerUrl ? (
                  <div className="h-40 w-full overflow-hidden relative bg-bg-main">
                    <Image
                      src={event.bannerUrl}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <Badge variant={event.status === "PUBLISHED" ? "success" : "warning"}>
                        {event.status === "PUBLISHED" ? "Publicado" : "Encerrado"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 w-full bg-bg-surface-hover flex items-center justify-between p-4 shadow-sm">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      {event.category}
                    </span>
                    <Badge variant={event.status === "PUBLISHED" ? "success" : "warning"}>
                      {event.status === "PUBLISHED" ? "Publicado" : "Encerrado"}
                    </Badge>
                  </div>
                )}

                {/* Conteúdo do Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-text-primary tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h2>
                    <div className="space-y-1 text-xs text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {event.locationName} • {event.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumo de Check-in */}
                  <div className="bg-bg-main/60 rounded-lg p-3 shadow-sm grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted block">Emitidos</span>
                      <span className="font-bold text-text-primary flex items-center gap-1 mt-0.5">
                        <Ticket className="w-3.5 h-3.5 text-text-muted" />
                        {event.totalSold}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Check-ins</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {event.totalCheckedIn} ({occupancyRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Ação de Seleção */}
                  <Button
                    variant="primary"
                    onClick={() => onSelectEvent(event)}
                    className="w-full min-h-[48px] justify-center text-sm font-semibold shadow-sm"
                  >
                    Selecionar Evento
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
