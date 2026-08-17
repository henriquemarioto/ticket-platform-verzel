"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { GatekeeperEvent } from "./types";
import { GatekeeperEventSelector } from "./GatekeeperEventSelector";
import { GatekeeperHeader } from "./GatekeeperHeader";
import { GatekeeperMetrics } from "./GatekeeperMetrics";
import { GatekeeperTabs, ValidationMode } from "./GatekeeperTabs";

interface GatekeeperDashboardProps {
  initialEvents: GatekeeperEvent[];
}

export function GatekeeperDashboard({ initialEvents }: GatekeeperDashboardProps) {
  const [events, setEvents] = useState<GatekeeperEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ValidationMode>("camera");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { success, error } = useToast();

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/gate/events", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Não foi possível atualizar as métricas da portaria.");
      }

      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        success("Métricas atualizadas com sucesso!");
      }
    } catch (err) {
      error((err as Error).message || "Erro ao sincronizar métricas.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleValidationSuccess = () => {
    if (!selectedEventId) return;
    setEvents((prev) => 
      prev.map((e) => 
        e.id === selectedEventId 
          ? { ...e, totalCheckedIn: e.totalCheckedIn + 1 }
          : e
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      {!selectedEvent ? (
        <GatekeeperEventSelector
          events={events}
          onSelectEvent={(event) => setSelectedEventId(event.id)}
        />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <GatekeeperHeader
            event={selectedEvent}
            onSwitchEvent={() => setSelectedEventId(null)}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <GatekeeperMetrics event={selectedEvent} />

          <GatekeeperTabs
            event={selectedEvent}
            activeMode={activeMode}
            onSelectMode={setActiveMode}
            onValidationSuccess={handleValidationSuccess}
          />
        </div>
      )}
    </div>
  );
}
