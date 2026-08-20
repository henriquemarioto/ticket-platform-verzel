"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { Seat } from "@prisma/client";
import { OrganizerCannotBuyModal } from "./OrganizerCannotBuyModal";

interface SeatMapProps {
  eventId: string;
  sectorId: string;
  price: number;
  currentUserRole?: string | null;
}

export function SeatMap({ eventId, sectorId, price, currentUserRole }: SeatMapProps) {
  const [seats, setSeats] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUserId;

  const router = useRouter();
  const { success, error: showError, warning, info } = useToast();

  const fetchSeats = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/seats`);
      if (!res.ok) throw new Error("Erro ao carregar assentos");
      const data = await res.json();
      
      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
        currentUserIdRef.current = data.currentUserId;
      }

      const sector = data.sectors?.find((s: any) => s.id === sectorId);
      if (sector) {
        setSeats(sector.seats || []);

        // Sanitiza seleção se algum assento ficou indisponível enquanto a aba estava inativa
        setSelectedSeatIds((prevSelected) => {
          if (prevSelected.length === 0) return prevSelected;
          const availableOrMySeatIds = new Set(
            sector.seats
              .filter(
                (s: any) =>
                  s.status === "AVAILABLE" ||
                  (s.status === "RESERVED" && data.currentUserId && s.reservedById === data.currentUserId)
              )
              .map((s: any) => s.id)
          );
          const validSelected = prevSelected.filter((id) => availableOrMySeatIds.has(id));
          if (validSelected.length < prevSelected.length) {
            warning("Um ou mais assentos selecionados ficaram indisponíveis.");
          }
          return validSelected;
        });
      }
    } catch (error) {
      showError("Não foi possível carregar o mapa de assentos.");
    } finally {
      setLoading(false);
    }
  }, [eventId, sectorId, showError, warning]);

  // Carga inicial
  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Conexão SSE em tempo real com auto-reconexão e cleanup
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isUnmounted = false;

    const connectSSE = () => {
      if (isUnmounted) return;

      eventSource = new EventSource(`/api/events/${eventId}/seats/stream`);

      eventSource.onopen = () => {
        if (!isUnmounted) {
          setIsLive(true);
        }
      };

      eventSource.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "SEAT_STATUS_CHANGED" && Array.isArray(data.seats)) {
            const changedSeats: Array<{
              id: string;
              status: string;
              reservedUntil?: string | null;
              reservedById?: string | null;
              row?: string;
              number?: number;
            }> = data.seats;

            setSeats((prevSeats) => {
              const changedMap = new Map(changedSeats.map((s) => [s.id, s]));
              return prevSeats.map((seat) => {
                const updated = changedMap.get(seat.id);
                if (updated) {
                  return {
                    ...seat,
                    ...updated,
                  };
                }
                return seat;
              });
            });

            // Se algum assento selecionado foi reservado ou vendido por outro usuário, remove e notifica
            setSelectedSeatIds((prevSelected) => {
              const user = currentUserIdRef.current;
              const conflictSeats = changedSeats.filter(
                (cs) =>
                  prevSelected.includes(cs.id) &&
                  (cs.status === "RESERVED" || cs.status === "SOLD") &&
                  cs.reservedById !== user
              );

              if (conflictSeats.length > 0) {
                warning("Um dos assentos selecionados acabou de ser reservado por outro comprador.");
                const conflictIds = new Set(conflictSeats.map((cs) => cs.id));
                return prevSelected.filter((id) => !conflictIds.has(id));
              }

              return prevSelected;
            });
          }
        } catch (err) {
          // Heartbeat / ping / dados não-JSON
        }
      };

      eventSource.onerror = () => {
        if (!isUnmounted) {
          setIsLive(false);
        }
      };
    };

    connectSSE();

    return () => {
      isUnmounted = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [eventId, warning]);

  // Sincronização de foco ao retornar à aba (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSeats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSeats]);

  const toggleSeat = (seat: any) => {
    if (currentUserRole === "ORGANIZER") {
      setIsOrganizerModalOpen(true);
      return;
    }

    if (seat.status === "RESERVED" && currentUserId && seat.reservedById === currentUserId) {
       const resId = seat.reservationItems?.[0]?.reservationId;
       if (resId) {
          router.push(`/checkout?reservationId=${resId}`);
       }
       return;
    }

    if (seat.status !== "AVAILABLE") return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }
      if (prev.length >= 6) {
        warning("Você pode selecionar no máximo 6 assentos.");
        return prev;
      }
      return [...prev, seat.id];
    });
  };

  const handleReserve = async () => {
    if (currentUserRole === "ORGANIZER") {
      setIsOrganizerModalOpen(true);
      return;
    }

    if (selectedSeatIds.length === 0) return;

    if (!currentUserId && !currentUserRole) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "verzel_pending_purchase",
          JSON.stringify({
            type: "NUMBERED_SEATS",
            eventId,
            sectorId,
            seatIds: selectedSeatIds,
          })
        );
      }
      info("Faça login para continuar sua compra de assentos.");
      router.push(`/login?returnUrl=/events/${eventId}`);
      return;
    }
    
    setReserving(true);
    try {
      const res = await fetch("/api/seats/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, sectorId, seatIds: selectedSeatIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === "ORGANIZER_CANNOT_BUY") {
          setIsOrganizerModalOpen(true);
          return;
        }
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "verzel_pending_purchase",
              JSON.stringify({
                type: "NUMBERED_SEATS",
                eventId,
                sectorId,
                seatIds: selectedSeatIds,
              })
            );
          }
          info("Você precisa fazer login para reservar ingressos.");
          router.push(`/login?returnUrl=/events/${eventId}`);
          return;
        }
        showError(data.error || "Erro ao reservar assentos.");
        if (res.status === 409 && data.unavailableSeatIds) {
          // Atualiza status localmente para refletir indisponibilidade
          setSeats((prev) =>
            prev.map((s) =>
              data.unavailableSeatIds.includes(s.id)
                ? { ...s, status: "RESERVED" }
                : s
            )
          );
          // Remove os assentos que se tornaram indisponíveis da seleção
          setSelectedSeatIds((prev) =>
            prev.filter((id) => !data.unavailableSeatIds.includes(id))
          );
        }
        return;
      }

      success("Assentos reservados! Redirecionando para pagamento...");
      router.push(`/checkout?reservationId=${data.reservationId}`);
    } catch (error) {
      showError("Ocorreu um erro de conexão.");
    } finally {
      setReserving(false);
    }
  };

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price * selectedSeatIds.length);

  // Agrupamento de assentos por fileira ordenada alfabeticamente
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>();
    seats.forEach((seat) => {
      const rowKey = (seat.row || "").toUpperCase();
      if (!map.has(rowKey)) map.set(rowKey, []);
      map.get(rowKey)!.push(seat);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col rounded-lg bg-surface-hover/20 p-4 sm:p-8">
        {/* Header com Indicador em Tempo Real e Legenda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Indicador de Sincronização em Tempo Real */}
          <div className="flex items-center gap-2">
            {isLive ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Ao vivo</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700">
                <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                <span>Reconectando...</span>
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-surface shadow-sm ring-1 ring-border-subtle"></div>
              <span className="text-text-muted">Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span className="text-text-muted">Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/80"></div>
              <span className="text-text-muted">Em Reserva</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300 opacity-50"></div>
              <span className="text-text-muted">Ocupado</span>
            </div>
            {currentUserId && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20 ring-1 ring-primary text-primary flex items-center justify-center">
                  <span className="text-[8px]">★</span>
                </div>
                <span className="text-text-muted">Sua Reserva</span>
              </div>
            )}
          </div>
        </div>

        {/* Palco */}
        <div className="w-full max-w-md mx-auto mb-10 text-center">
          <div className="h-8 w-full bg-gradient-to-t from-primary/20 to-transparent rounded-t-full shadow-sm flex items-end justify-center pb-1">
            <span className="text-xs uppercase tracking-widest text-text-muted font-bold">Palco / Tela</span>
          </div>
        </div>

        {/* Grid de Assentos */}
        <div className="flex flex-col items-center gap-4 overflow-x-auto pb-4">
          {rows.map(([rowName, rowSeats]) => {
            const displayRowName = rowName.toUpperCase();
            return (
              <div key={rowName} className="flex items-center gap-4 min-w-max">
                <div className="w-6 text-center font-bold text-text-muted">{displayRowName}</div>
                <div className="flex gap-2">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isMyReservation = seat.status === "RESERVED" && currentUserId && seat.reservedById === currentUserId;
                    const rowUpper = (seat.row || "").toUpperCase();
                    
                    let seatClass = "w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-medium transition-all ";
                    let content: React.ReactNode = seat.number;
                    
                    if (isSelected) {
                      seatClass += "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,87,255,0.5)] transform scale-110 cursor-pointer";
                    } else if (seat.status === "AVAILABLE") {
                      seatClass += "bg-surface shadow-sm hover:shadow-sm ring-1 ring-primary/50 hover:bg-surface-hover cursor-pointer text-text-primary";
                    } else if (isMyReservation) {
                      seatClass += "bg-primary/20 shadow-md border-0 shadow-sm ring-1 ring-primary text-primary cursor-pointer hover:bg-primary/30";
                      content = <span className="flex flex-col items-center leading-none"><span className="text-[10px]">★</span>{seat.number}</span>;
                    } else if (seat.status === "RESERVED") {
                      seatClass += "bg-yellow-500/80 text-white cursor-not-allowed";
                    } else {
                      seatClass += "bg-gray-300 opacity-50 cursor-not-allowed text-gray-500";
                    }

                    return (
                      <button
                        key={seat.id}
                        className={seatClass}
                        disabled={seat.status !== "AVAILABLE" && !isSelected && !isMyReservation}
                        onClick={() => toggleSeat(seat)}
                        title={isMyReservation ? `Sua Reserva (Assento ${rowUpper}${seat.number}) - Clique para pagar` : `Assento ${rowUpper}${seat.number}`}
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
                <div className="w-6 text-center font-bold text-text-muted">{displayRowName}</div>
              </div>
            );
          })}
        </div>

        {/* Rodapé e Checkout */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div>
            <span className="block text-sm font-medium text-text-muted">
              {selectedSeatIds.length} assento(s) selecionado(s)
            </span>
            <span className="text-2xl font-bold text-primary">{formattedTotal}</span>
          </div>
          <Button
            variant="primary"
            className="w-full sm:w-auto h-12 px-8"
            disabled={selectedSeatIds.length === 0 || reserving}
            onClick={handleReserve}
          >
            {reserving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Reservando...
              </>
            ) : (
              "Avançar para Pagamento"
            )}
          </Button>
        </div>
      </div>

      <OrganizerCannotBuyModal
        isOpen={isOrganizerModalOpen}
        onClose={() => setIsOrganizerModalOpen(false)}
        eventId={eventId}
      />
    </>
  );
}
