"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Calendar, MapPin, QrCode, Share2, Loader2, Clock, AlertTriangle } from "lucide-react";
import { formatEventDateRange, formatEntryTime } from "@/lib/utils/date-formatters";

export interface TicketItemData {
  id: string;
  ticketCode: string;
  qrPayload: string;
  status: string;
  eventId?: string;
  usedAt?: Date | string | null;
  event: {
    id: string;
    title: string;
    bannerUrl?: string | null;
    locationName: string;
    city: string;
    eventDate: Date | string;
    endDate?: Date | string | null;
    entryStartTime?: Date | string;
  };
  sector: {
    id: string;
    name: string;
    type: string;
    price?: number;
  };
  seat?: {
    id: string;
    row: string;
    number: number;
  } | null;
}

type TicketCardProps = {
  ticket: TicketItemData;
  onShowQR: (ticket: TicketItemData) => void;
  onTicketCancelled?: () => void;
};

export function TicketCard({ ticket, onShowQR, onTicketCancelled }: TicketCardProps) {
  const { event, sector, seat } = ticket;
  const { success, error: showError } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isEventFuture = new Date(event.eventDate).getTime() > Date.now();
  const canCancel = ticket.status === "ACTIVE" && isEventFuture;

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const res = await fetch(`/api/tickets/${ticket.id}/share`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao compartilhar");

      const url = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(url);
      
      success("Link copiado para a área de transferência.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao compartilhar";
      showError(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCancelTicket = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`/api/tickets/${ticket.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cancelar ingresso");
      }

      success("Ingresso cancelado com sucesso e valor estornado.");
      setIsCancelModalOpen(false);
      onTicketCancelled?.();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao cancelar ingresso";
      showError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const formattedDate = formatEventDateRange(event.eventDate, event.endDate);
  const entryTimeLabel = event.entryStartTime
    ? formatEntryTime(event.entryStartTime, event.eventDate)
    : "";

  const formattedRefundPrice = typeof sector.price === "number"
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sector.price)
    : null;

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "ACTIVE":
        return <Badge variant="success">Ativo</Badge>;
      case "USED":
        return <Badge variant="warning">Utilizado</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelado</Badge>;
      default:
        return <Badge variant="neutral">{ticket.status}</Badge>;
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row shadow-sm rounded-xl overflow-hidden bg-bg-surface hover:bg-bg-surface-hover transition-colors border border-border-subtle">
        <div 
          className="w-full sm:w-48 h-40 sm:h-auto bg-cover bg-center shrink-0" 
          style={{ backgroundImage: `url(${event.bannerUrl})` }} 
        />
        
        <div className="flex-1 p-5 flex flex-col justify-between gap-4 relative">
          {/* Marca d'água para inativos */}
          {ticket.status !== "ACTIVE" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <span className="text-6xl font-black uppercase text-text-muted transform -rotate-12">
                {ticket.status === "USED" ? "Utilizado" : "Cancelado"}
              </span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-start mb-2 gap-2">
              <h3 className="font-semibold text-lg text-text-primary leading-tight">{event.title}</h3>
              {getStatusBadge()}
            </div>
            
            <div className="space-y-1.5 text-sm text-text-muted">
              {entryTimeLabel && (
                <div className="flex items-center gap-2 text-primary font-medium text-xs">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{entryTimeLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Início: {formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{event.locationName} • {event.city}</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-bg-main rounded-lg shadow-sm grid grid-cols-2 gap-2 text-sm border border-border-subtle">
              <div>
                <p className="text-text-muted text-xs">Setor</p>
                <p className="font-medium text-text-primary">{sector.name}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Assento</p>
                <p className="font-medium text-text-primary">
                  {seat ? `${seat.row.toUpperCase()}${seat.number}` : "Pista (S/ Assento)"}
                </p>
              </div>
              <div className="col-span-2 pt-2 mt-2 border-t border-border-subtle flex justify-between items-center">
                <div>
                  <p className="text-text-muted text-xs">Código do Ingresso</p>
                  <p className="font-mono text-primary font-semibold tracking-wider">{ticket.ticketCode}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <Button 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => onShowQR(ticket)}
              >
                <QrCode className="w-4 h-4" />
                Exibir QR Code
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 px-3"
                onClick={handleShare}
                disabled={isSharing}
                title="Compartilhar ingresso"
                aria-label="Compartilhar ingresso"
              >
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                <span className="sr-only">Compartilhar</span>
              </Button>
            </div>

            {canCancel && (
              <Button
                variant="outline"
                className="w-full text-danger border-danger/30 hover:bg-danger/10 hover:text-danger hover:border-danger/60 text-sm font-medium transition-colors"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancelar Ingresso
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Defensivo de Confirmação de Cancelamento */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !isCancelling && setIsCancelModalOpen(false)}
        title=""
      >
        <div className="flex flex-col items-center text-center pt-2">
          <div className="bg-danger/10 p-4 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-danger" />
          </div>

          <h3 className="text-xl font-bold text-text-primary mb-2">Cancelar Ingresso</h3>

          <p className="text-sm text-text-muted mb-6">
            Tem certeza de que deseja cancelar este ingresso? Esta ação é irreversível.
          </p>

          {/* Detalhes do Cancelamento */}
          <div className="w-full bg-bg-main p-4 rounded-xl border border-border-subtle text-left text-sm space-y-2.5 mb-4">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-text-muted">Evento:</span>
              <span className="font-semibold text-text-primary text-right truncate max-w-[200px]" title={event.title}>
                {event.title}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-text-muted">Setor:</span>
              <span className="font-medium text-text-primary">{sector.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-text-muted">Assento:</span>
              <span className="font-medium text-text-primary">
                {seat ? `${seat.row.toUpperCase()}${seat.number}` : "Pista (S/ Assento)"}
              </span>
            </div>
            {formattedRefundPrice && (
              <div className="flex justify-between items-center text-xs sm:text-sm pt-2.5 border-t border-border-subtle">
                <span className="text-text-muted font-medium">Valor do estorno:</span>
                <span className="font-bold text-success text-base">{formattedRefundPrice}</span>
              </div>
            )}
          </div>

          {/* Aviso Defensivo */}
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-3.5 w-full mb-6 text-left flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger leading-relaxed font-medium">
              Após o cancelamento, seu QR Code será desativado e a vaga voltará a ficar disponível para outros clientes.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex w-full gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Voltar
            </Button>
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={handleCancelTicket}
              loading={isCancelling}
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
