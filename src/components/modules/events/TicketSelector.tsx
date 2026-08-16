"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Minus, Plus, Loader2 } from "lucide-react";

interface TicketSelectorProps {
  sectorId: string;
  price: number;
  availableCapacity: number;
}

export function TicketSelector({ sectorId, price, availableCapacity }: TicketSelectorProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const res = await fetch("/api/reservations/general-admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectorId, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast("info", "Você precisa fazer login para reservar ingressos.");
          // Pega o ID do evento através da URL atual
          router.push(`/login?returnUrl=${window.location.pathname}`);
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-lg bg-surface-hover/30 p-4">
      <div className="flex flex-col items-center sm:items-start gap-2">
        <span className="text-sm font-medium text-text-muted">Quantidade</span>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-full"
            onClick={decrement}
            disabled={quantity <= 1 || loading}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold w-6 text-center text-text-primary">{quantity}</span>
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-full"
            onClick={increment}
            disabled={quantity >= maxAllowed || loading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <div className="text-center sm:text-right">
          <span className="text-sm font-medium text-text-muted block">Valor Total</span>
          <span className="text-2xl font-bold text-primary">{formattedTotal}</span>
        </div>
        <Button 
          variant="primary" 
          className="w-full sm:w-auto h-12 px-8" 
          onClick={handleReserve}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            "Ir para Pagamento"
          )}
        </Button>
      </div>
    </div>
  );
}
