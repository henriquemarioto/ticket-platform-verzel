"use client";

import { ArrowLeft, RefreshCw, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEventDateRange, formatEntryTime } from "@/lib/utils/date-formatters";
import { GatekeeperEvent } from "./types";

interface GatekeeperHeaderProps {
  event: GatekeeperEvent;
  onSwitchEvent: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function GatekeeperHeader({
  event,
  onSwitchEvent,
  onRefresh,
  isRefreshing,
}: GatekeeperHeaderProps) {
  const formattedDate = formatEventDateRange(event.eventDate, event.endDate);
  const entryTimeLabel = formatEntryTime(event.entryStartTime, event.eventDate);

  return (
    <div className="bg-bg-surface shadow-sm rounded-xl p-4 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">Portaria Ativa</Badge>
            {event.isEnded ? (
              <Badge variant="danger">Evento Encerrado</Badge>
            ) : (
              <Badge variant={event.isEntryOpen ? "success" : "warning"}>
                {event.isEntryOpen ? "Portões Abertos" : "Portões Fechados"}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-text-muted">
            <div className="flex items-center gap-1.5 font-medium text-text-primary">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>{entryTimeLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <span>Início: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-text-muted shrink-0" />
              <span>
                {event.locationName}
                {event.street ? ` • ${event.street}, ${event.number || "S/N"}${event.neighborhood ? ` - ${event.neighborhood}` : ""}` : ""}
                {` • ${event.city}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t border-border-subtle lg:border-t-0">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="min-h-[48px] px-4 gap-2 flex-1 sm:flex-none justify-center"
            aria-label="Atualizar métricas de check-in"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Sincronizar</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onSwitchEvent}
            className="min-h-[48px] px-4 gap-2 flex-1 sm:flex-none justify-center"
            aria-label="Trocar de evento"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trocar Evento</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
