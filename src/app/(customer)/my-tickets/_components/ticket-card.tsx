'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  Calendar,
  MapPin,
  QrCode,
  Share2,
  Loader2,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import {
  formatEventDateRange,
  formatEntryTime,
} from '@/lib/utils/date-formatters';

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

export function TicketCard({
  ticket,
  onShowQR,
  onTicketCancelled,
}: TicketCardProps) {
  const { event, sector, seat } = ticket;
  const { success, error: showError } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [now] = useState(() => Date.now());
  const isEventFuture = new Date(event.eventDate).getTime() > now;
  const canCancel = ticket.status === 'ACTIVE' && isEventFuture;

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const res = await fetch(`/api/tickets/${ticket.id}/share`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao compartilhar');

      const url = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(url);

      success('Link copiado para a área de transferência.');
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Erro ao compartilhar';
      showError(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCancelTicket = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`/api/tickets/${ticket.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cancelar ingresso');
      }

      success('Ingresso cancelado com sucesso e valor estornado.');
      setIsCancelModalOpen(false);
      onTicketCancelled?.();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Erro ao cancelar ingresso';
      showError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const formattedDate = formatEventDateRange(event.eventDate, event.endDate);
  const entryTimeLabel = event.entryStartTime
    ? formatEntryTime(event.entryStartTime, event.eventDate)
    : '';

  const formattedRefundPrice =
    typeof sector.price === 'number'
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(sector.price)
      : null;

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'ACTIVE':
        return <Badge variant="success">Ativo</Badge>;
      case 'USED':
        return <Badge variant="warning">Utilizado</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelado</Badge>;
      default:
        return <Badge variant="neutral">{ticket.status}</Badge>;
    }
  };

  return (
    <>
      <div className="ticket-card-surface flex flex-col overflow-hidden rounded-xl border border-border-subtle shadow-sm sm:flex-row relative">
        {/* Faixa Técnica Superior para Mobile */}
        <div className="flex sm:hidden items-center justify-between border-b border-border-subtle bg-bg-surface-hover/80 px-4 py-2 text-xs font-mono">
          <span className="font-bold text-primary">VERZEL PASS // {ticket.ticketCode}</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
            HMAC-256
          </span>
        </div>

        {/* Canhoto Lateral / Banner */}
        <div
          className="h-44 w-full shrink-0 bg-cover bg-center sm:h-auto sm:w-48 relative"
          style={{ backgroundImage: `url(${event.bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden" />
        </div>

        {/* Corpo do Bilhete */}
        <div className="relative flex flex-1 flex-col justify-between gap-4 p-5">
          {/* Marca d'água para inativos */}
          {ticket.status !== 'ACTIVE' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <span className="text-text-muted -rotate-12 transform text-6xl font-black uppercase">
                {ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}
              </span>
            </div>
          )}

          <div>
            {/* Cabeçalho Técnico Desktop */}
            <div className="hidden sm:flex items-center justify-between mb-3 pb-2 border-b border-border-subtle/60 text-xs font-mono">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERZEL PASS // {ticket.ticketCode}
              </span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary border border-primary/20">
                HMAC-256 VERIFIED
              </span>
            </div>

            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-text-primary text-lg leading-tight font-bold">
                {event.title}
              </h3>
              {getStatusBadge()}
            </div>

            <div className="text-text-muted space-y-1.5 text-sm">
              {entryTimeLabel && (
                <div className="text-primary flex items-center gap-2 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{entryTimeLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
                <span>Início: {formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-text-muted" />
                <span>
                  {event.locationName} &bull; {event.city}
                </span>
              </div>
            </div>

            {/* Bloco de Setor / Assento / Código */}
            <div className="bg-bg-main border border-border-subtle mt-4 grid grid-cols-2 gap-2 rounded-lg p-3 text-sm">
              <div>
                <p className="text-text-muted text-[11px] font-mono uppercase">Setor</p>
                <p className="text-text-primary font-bold">{sector.name}</p>
              </div>
              <div>
                <p className="text-text-muted text-[11px] font-mono uppercase">Assento</p>
                <p className="text-text-primary font-bold">
                  {seat
                    ? `${seat.row.toUpperCase()}${seat.number}`
                    : 'Pista (S/ Assento)'}
                </p>
              </div>
              <div className="border-border-subtle col-span-2 mt-2 flex items-center justify-between border-t border-dashed pt-2">
                <div>
                  <p className="text-text-muted text-[11px] font-mono uppercase">Código do Ingresso</p>
                  <p className="text-primary font-mono font-bold tracking-wider">
                    {ticket.ticketCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex flex-1 items-center justify-center gap-2 text-sm font-bold"
                onClick={() => onShowQR(ticket)}
              >
                <QrCode className="h-4 w-4" />
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
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span className="sr-only">Compartilhar</span>
              </Button>
            </div>

            {canCancel && (
              <Button
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/10 hover:text-danger hover:border-danger/60 w-full text-xs font-semibold transition-colors"
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
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="bg-danger/10 mb-4 rounded-full p-4">
            <AlertTriangle className="text-danger h-10 w-10" />
          </div>

          <h3 className="text-text-primary mb-2 text-xl font-bold">
            Cancelar Ingresso
          </h3>

          <p className="text-text-muted mb-6 text-sm">
            Tem certeza de que deseja cancelar este ingresso? Esta ação é
            irreversível e seu QR Code será revogado na portaria.
          </p>

          {/* Detalhes do Cancelamento */}
          <div className="bg-bg-main border border-border-subtle mb-4 w-full space-y-2.5 rounded-xl p-4 text-left text-sm">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-text-muted">Evento:</span>
              <span
                className="text-text-primary max-w-[200px] truncate text-right font-semibold"
                title={event.title}
              >
                {event.title}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-text-muted">Setor:</span>
              <span className="text-text-primary font-medium">
                {sector.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-text-muted">Assento:</span>
              <span className="text-text-primary font-medium">
                {seat
                  ? `${seat.row.toUpperCase()}${seat.number}`
                  : 'Pista (S/ Assento)'}
              </span>
            </div>
            {formattedRefundPrice && (
              <div className="border-border-subtle flex items-center justify-between border-t pt-2.5 text-xs sm:text-sm">
                <span className="text-text-muted font-medium">
                  Valor do estorno:
                </span>
                <span className="text-success text-base font-bold">
                  {formattedRefundPrice}
                </span>
              </div>
            )}
          </div>

          {/* Aviso Defensivo */}
          <div className="bg-danger/5 border border-danger/20 mb-6 flex w-full items-start gap-2.5 rounded-xl p-3.5 text-left">
            <AlertTriangle className="text-danger mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-danger text-xs leading-relaxed font-medium">
              Após o cancelamento, seu QR Code será desativado e o assento voltará a ficar disponível para outros clientes.
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
