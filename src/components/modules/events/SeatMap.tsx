"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { Seat } from "@prisma/client";

interface SeatMapProps {
  eventId: string;
  sectorId: string;
  price: number;
}

export function SeatMap({ eventId, sectorId, price }: SeatMapProps) {
  const [seats, setSeats] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/seats`);
        if (!res.ok) throw new Error("Erro ao carregar assentos");
        const data = await res.json();
        
        if (data.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }

        const sector = data.sectors.find((s: any) => s.id === sectorId);
        if (sector) {
          setSeats(sector.seats);
        }
      } catch (error) {
        toast("error", "Não foi possível carregar o mapa de assentos.");
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [eventId, sectorId, toast]);

  const toggleSeat = (seat: any) => {
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
        toast("warning", "Você pode selecionar no máximo 6 assentos.");
        return prev;
      }
      return [...prev, seat.id];
    });
  };

  const handleReserve = async () => {
    if (selectedSeatIds.length === 0) return;
    
    setReserving(true);
    try {
      const res = await fetch("/api/seats/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, sectorId, seatIds: selectedSeatIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast("info", "Você precisa fazer login para reservar ingressos.");
          router.push(`/login?returnUrl=/events/${eventId}`);
          return;
        }
        toast("error", data.error || "Erro ao reservar assentos.");
        if (res.status === 409 && data.unavailableSeatIds) {
          // Atualizar o status localmente para refletir a indisponibilidade
          setSeats((prev) =>
            prev.map((s) =>
              data.unavailableSeatIds.includes(s.id)
                ? { ...s, status: "RESERVED" }
                : s
            )
          );
          // Remover os indisponíveis da seleção atual
          setSelectedSeatIds((prev) =>
            prev.filter((id) => !data.unavailableSeatIds.includes(id))
          );
        }
        return;
      }

      toast("success", "Assentos reservados! Redirecionando para pagamento...");
      router.push(`/checkout?reservationId=${data.reservationId}`);
    } catch (error) {
      toast("error", "Ocorreu um erro de conexão.");
    } finally {
      setReserving(false);
    }
  };

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price * selectedSeatIds.length);

  // Group seats by row
  const rows = useMemo(() => {
    const map = new Map<string, Seat[]>();
    seats.forEach((seat) => {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    });
    // Sort rows alphabetically
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
    <div className="flex flex-col rounded-lg bg-surface-hover/20 p-4 sm:p-8">
      {/* Legenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface shadow-sm"></div>
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
            <div className="w-4 h-4 rounded bg-primary/20 shadow-md border-0 shadow-sm ring-1 ring-primary text-primary flex items-center justify-center">
              <span className="text-[8px]">★</span>
            </div>
            <span className="text-text-muted">Sua Reserva</span>
          </div>
        )}
      </div>

      {/* Palco */}
      <div className="w-full max-w-md mx-auto mb-10 text-center">
        <div className="h-8 w-full bg-gradient-to-t from-primary/20 to-transparent rounded-t-full shadow-sm flex items-end justify-center pb-1">
          <span className="text-xs uppercase tracking-widest text-text-muted font-bold">Palco / Tela</span>
        </div>
      </div>

      {/* Grid de Assentos */}
      <div className="flex flex-col items-center gap-4 overflow-x-auto pb-4">
        {rows.map(([rowName, rowSeats]) => (
          <div key={rowName} className="flex items-center gap-4 min-w-max">
            <div className="w-6 text-center font-bold text-text-muted">{rowName}</div>
            <div className="flex gap-2">
              {rowSeats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isMyReservation = seat.status === "RESERVED" && currentUserId && seat.reservedById === currentUserId;
                
                let seatClass = "w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-medium transition-all ";
                let content: React.ReactNode = seat.number;
                
                if (isSelected) {
                  seatClass += "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(16,185,129,0.5)] transform scale-110 cursor-pointer";
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
                    title={isMyReservation ? `Sua Reserva (Assento ${seat.row}${seat.number}) - Clique para pagar` : `Assento ${seat.row}${seat.number}`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
            <div className="w-6 text-center font-bold text-text-muted">{rowName}</div>
          </div>
        ))}
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
  );
}
