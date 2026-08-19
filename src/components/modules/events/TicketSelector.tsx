"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Minus, Plus, Loader2 } from "lucide-react";
import { OrganizerCannotBuyModal } from "./OrganizerCannotBuyModal";

interface TicketSelectorProps {
  sectorId: string;
  price: number;
  availableCapacity: number;
  currentUserRole?: string | null;
  eventId?: string;
}

export function TicketSelector({
  sectorId,
  price,
  availableCapacity,
  currentUserRole,
  eventId,
}: TicketSelectorProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const maxAllowed = Math.min(6, availableCapacity);

  const increment = () => setQuantity((q) => (q < maxAllowed ? q + 1 : q));
  const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : q));

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price * quantity);

  const handleReserve = async () => {
    if (currentUserRole === "ORGANIZER") {
      setIsOrganizerModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservations/general-admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectorId, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === "ORGANIZER_CANNOT_BUY") {
          setIsOrganizerModalOpen(true);
          return;
        }
        if (res.status === 401) {
          toast("info", "Você precisa fazer login para reservar ingressos.");
          const returnPath = eventId ? `/events/${eventId}` : window.location.pathname;
          router.push(`/login?returnUrl=${returnPath}`);
          return;
        }
        toast("error", data.error || "Erro ao reservar ingressos.");
        return;
      }

      toast("success", "Ingressos reservados! Redirecionando para pagamento...");
      router.push(`/checkout?reservationId=${data.reservation.id}`);
    } catch (error) {
      toast("error", "Ocorreu um erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-subtle bg-surface-hover/50 p-4">
        {/* Quantity Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Quantidade</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-8 w-8 p-0 rounded-full"
              onClick={decrement}
              disabled={quantity <= 1 || loading}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-bold w-6 text-center text-text-primary">{quantity}</span>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 rounded-full"
              onClick={increment}
              disabled={quantity >= maxAllowed || loading}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="h-px w-full bg-subtle/50" />

        {/* Total and Button */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Valor Total</span>
            <span className="text-lg font-bold text-primary">{formattedTotal}</span>
          </div>
          <Button 
            variant="primary" 
            className="w-full h-10" 
            onClick={handleReserve}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Ir para Pagamento"
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
