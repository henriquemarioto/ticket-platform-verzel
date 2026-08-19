"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { GatekeeperEvent, EventMetrics } from "./types";
import { GatekeeperEventSelector } from "./GatekeeperEventSelector";
import { GatekeeperHeader } from "./GatekeeperHeader";
import { GatekeeperMetrics } from "./GatekeeperMetrics";
import { GatekeeperTabs, ValidationMode } from "./GatekeeperTabs";

interface GatekeeperDashboardProps {
  initialEvents: GatekeeperEvent[];
  initialServerTime?: string;
}

export function GatekeeperDashboard({
  initialEvents,
  initialServerTime,
}: GatekeeperDashboardProps) {
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(() => {
    return initialServerTime
      ? new Date(initialServerTime).getTime() - Date.now()
      : 0;
  });

  const recalculateEvents = useCallback(
    (eventsList: GatekeeperEvent[]) => {
      const currentEstimatedTime = new Date(Date.now() + clockOffsetMs);
      return eventsList.map((event) => {
        const entryTime = new Date(event.entryStartTime);
        const eventEndTime = event.endDate
          ? new Date(event.endDate)
          : new Date(new Date(event.eventDate).getTime() + 6 * 60 * 60 * 1000);
        const isEntryOpen = currentEstimatedTime >= entryTime;
        const isEnded = currentEstimatedTime >= eventEndTime;
        const isSelectable = isEntryOpen && !isEnded;
        return {
          ...event,
          isEntryOpen,
          isEnded,
          isSelectable,
        };
      });
    },
    [clockOffsetMs]
  );

  const [events, setEvents] = useState<GatekeeperEvent[]>(() =>
    recalculateEvents(initialEvents)
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ValidationMode>("camera");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { success, error } = useToast();

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    const currentEstTime = Date.now() + clockOffsetMs;

    events.forEach((event) => {
      const entryTimeMs = new Date(event.entryStartTime).getTime();
      const endTimeMs = event.endDate
        ? new Date(event.endDate).getTime()
        : new Date(event.eventDate).getTime() + 6 * 60 * 60 * 1000;

      const diffToOpen = entryTimeMs - currentEstTime;
      if (diffToOpen > 0 && diffToOpen < 24 * 60 * 60 * 1000) {
        timeouts.push(
          setTimeout(() => {
            setEvents((prev) => recalculateEvents(prev));
          }, diffToOpen)
        );
      }

      const diffToEnd = endTimeMs - currentEstTime;
      if (diffToEnd > 0 && diffToEnd < 24 * 60 * 60 * 1000) {
        timeouts.push(
          setTimeout(() => {
            setEvents((prev) => recalculateEvents(prev));
          }, diffToEnd)
        );
      }
    });

    const interval = setInterval(() => {
      setEvents((prev) => recalculateEvents(prev));
    }, 10000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [clockOffsetMs, recalculateEvents, events]);

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
      if (data.serverTime) {
        setClockOffsetMs(new Date(data.serverTime).getTime() - Date.now());
      }
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

  const handleValidationComplete = (metrics?: EventMetrics) => {
    if (!selectedEventId || !metrics) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEventId
          ? {
              ...e,
              totalSold: metrics.totalSold ?? e.totalSold,
              totalCheckedIn: metrics.totalCheckedIn ?? e.totalCheckedIn,
            }
          : e
      )
    );
  };

  const handleSelectEvent = (event: GatekeeperEvent) => {
    if (!event.isSelectable) {
      if (event.isEnded) {
        error("Este evento já foi encerrado e não pode ser selecionado.");
      } else {
        error("Os portões deste evento ainda estão fechados.");
      }
      return;
    }
    setSelectedEventId(event.id);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      {!selectedEvent ? (
        <GatekeeperEventSelector
          events={events}
          onSelectEvent={handleSelectEvent}
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
            onValidationComplete={handleValidationComplete}
          />
        </div>
      )}
    </div>
  );
}
