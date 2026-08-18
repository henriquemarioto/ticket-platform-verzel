"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Clock, CreditCard, XCircle, CheckCircle } from "lucide-react";

type ReservationItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  sector: {
    name: string;
  };
  seat?: {
    row: string;
    number: number;
  } | null;
};

type CheckoutClientProps = {
  reservationId: string;
  eventId: string;
  expiresAt: string;
  totalAmount: number;
  items: ReservationItem[];
  eventName: string;
};

export default function CheckoutClient({
  reservationId,
  eventId,
  expiresAt,
  totalAmount,
  items,
  eventName,
}: CheckoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expireDate = new Date(expiresAt).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expireDate - now;

      if (distance <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.floor(distance / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCheckout = async (action: "APPROVE" | "REJECT") => {
    if (isExpired) {
      toast("error", "O tempo limite de 10 minutos foi atingido. Você precisa selecionar os ingressos novamente.");
      router.push(`/events/${eventId}`);
      return;
    }

    setIsProcessing(true);
    
    try {
      const res = await fetch("/api/checkout/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId,
          action,
          paymentMethod: "SIMULATED_CREDIT_CARD",
          reason: action === "REJECT" ? "Saldo insuficiente (Simulação)" : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar checkout");
      }

      if (action === "APPROVE") {
        router.push(`/checkout/success?orderId=${data.orderId}`);
      } else {
        toast("error", data.error || "Pagamento não autorizado pela operadora do cartão. Os assentos foram liberados.");
        // Remove os itens da tela pois a reserva foi cancelada
        setIsExpired(true);
      }
    } catch (err: any) {
      toast("error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalAmount);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Resumo do Pedido */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl shadow-sm bg-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Resumo do Pedido</h2>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isExpired ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>
              <Clock className="w-4 h-4" />
              <span>{isExpired ? "Tempo Esgotado" : `Expira em ${formatTime(timeLeft)}`}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-text-primary mb-2">{eventName}</h3>
            <p className="text-sm text-text-muted">Revise os ingressos selecionados antes de prosseguir com o pagamento.</p>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-text-primary">{item.quantity}x {item.sector.name}</p>
                  {item.seat && (
                    <p className="text-sm text-text-muted">Assento: {item.seat.row}{item.seat.number}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.unitPrice * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-text-muted">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.unitPrice)} cada
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isExpired && (
          <div className="rounded-xl shadow-sm ring-1 ring-danger/30 bg-danger/5 p-6 text-center">
            <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Reserva Expirada ou Cancelada</h3>
            <p className="text-text-muted mb-6">
              Sua reserva expirou ou o pagamento foi recusado, e os assentos foram liberados para o público.
            </p>
            <Button variant="primary" onClick={() => router.push(`/events/${eventId}`)}>
              Voltar para o Evento
            </Button>
          </div>
        )}
      </div>

      {/* Pagamento */}
      <div className="space-y-6">
        <div className="rounded-xl shadow-sm bg-surface p-6 sticky top-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Pagamento</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span>
              <span>{formattedTotal}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Taxa de Serviço</span>
              <span>R$ 0,00</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-text-primary pt-4">
              <span>Total a Pagar</span>
              <span>{formattedTotal}</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-text-muted mb-4">Área de simulação (Apenas para fins de teste)</p>
            
            <Button 
              variant="primary" 
              className="w-full h-12" 
              onClick={() => handleCheckout("APPROVE")}
              disabled={isProcessing || isExpired}
              loading={isProcessing}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Simular Pagamento Aprovado
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-12 border-danger/50 text-danger hover:bg-danger/10 hover:text-danger hover:border-danger" 
              onClick={() => handleCheckout("REJECT")}
              disabled={isProcessing || isExpired}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Simular Pagamento Recusado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
