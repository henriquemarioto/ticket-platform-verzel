import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Calendar, MapPin, QrCode, Share2, Loader2 } from "lucide-react";
import { formatEventDateRange } from "@/lib/utils/date-formatters";

type TicketCardProps = {
  ticket: any;
  onShowQR: (ticket: any) => void;
};

export function TicketCard({ ticket, onShowQR }: TicketCardProps) {
  const { event, sector, seat } = ticket;
  const { success, error: showError } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const res = await fetch(`/api/tickets/${ticket.id}/share`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao compartilhar");

      const url = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(url);
      
      success("Link copiado para a área de transferência.");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSharing(false);
    }
  };

  const formattedDate = formatEventDateRange(event.eventDate, event.endDate);

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
    <div className="flex flex-col sm:flex-row shadow-sm rounded-xl overflow-hidden bg-bg-surface hover:bg-bg-surface-hover transition-colors">
      <div 
        className="w-full sm:w-48 h-40 sm:h-auto bg-cover bg-center" 
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
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-2 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.locationName} • {event.city}</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-bg-main rounded-lg shadow-sm grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-text-muted text-xs">Setor</p>
              <p className="font-medium">{sector.name}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Assento</p>
              <p className="font-medium">
                {seat ? `${seat.row}${seat.number}` : "Pista (S/ Assento)"}
              </p>
            </div>
            <div className="col-span-2 pt-2 mt-2 flex justify-between items-center">
              <div>
                <p className="text-text-muted text-xs">Código do Ingresso</p>
                <p className="font-mono text-primary font-semibold tracking-wider">{ticket.ticketCode}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
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
          >
            {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            <span className="sr-only">Compartilhar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
