import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { generateSharePasscode } from "@/lib/crypto";
import { formatEventDateRange, formatEntryTime } from "@/lib/utils/date-formatters";
import { Metadata } from "next";

export async function generateMetadata({ 
  params,
  searchParams,
}: { 
  params: Promise<{ token: string }>;
  searchParams: Promise<{ key?: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { key } = await searchParams;

  const expectedKey = generateSharePasscode(token);
  if (key !== expectedKey) {
    return { title: "Acesso Negado" };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { shareToken: token },
    include: { event: true },
  });

  if (!ticket) {
    return { title: "Ingresso Não Encontrado" };
  }

  return {
    title: `Ingresso: ${ticket.event.title} | Verzel Tickets`,
    description: "Voucher digital para entrada no evento.",
  };
}

export default async function ShareTicketPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ token: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { token } = await params;
  const { key } = await searchParams;

  const expectedKey = generateSharePasscode(token);
  if (key !== expectedKey) {
    notFound();
  }

  const ticket = await prisma.ticket.findUnique({
    where: { shareToken: token },
    include: {
      event: true,
      sector: true,
      seat: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  const { event, sector, seat } = ticket;

  const formattedDate = formatEventDateRange(event.eventDate, event.endDate);
  const entryTimeLabel = formatEntryTime(event.entryStartTime, event.eventDate);

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "ACTIVE":
        return <Badge variant="success">Válido para Entrada</Badge>;
      case "USED":
        return <Badge variant="warning">Já Utilizado</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelado pelo Titular</Badge>;
      default:
        return <Badge variant="neutral">{ticket.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-editorial-grid py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo size="lg" showTagline />
          <p className="text-xs font-mono text-text-muted mt-2 uppercase tracking-wider">
            Voucher Digital &bull; Apresente na Portaria
          </p>
        </div>

        <div className="ticket-card-surface rounded-2xl overflow-hidden shadow-xl relative border border-border-subtle bg-bg-surface">
          {ticket.status !== "ACTIVE" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none p-6 text-center">
              <span className="text-4xl font-black uppercase text-white transform -rotate-12 mb-4 drop-shadow-lg">
                {ticket.status === "USED" ? "Utilizado" : "Cancelado"}
              </span>
              <p className="text-white text-xs bg-black/70 p-3 rounded-lg leading-relaxed max-w-xs">
                {ticket.status === "USED" 
                  ? `Este ingresso já foi validado na portaria em ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleString("pt-BR") : "data desconhecida"}.`
                  : "Este ingresso foi cancelado pelo titular da compra e não é mais válido para entrada."}
              </p>
            </div>
          )}

          {/* Banner */}
          <div 
            className="w-full h-44 bg-cover bg-center" 
            style={{ backgroundImage: `url(${event.bannerUrl})` }} 
          />

          {/* Barra Técnica */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-surface-hover/70 text-xs font-mono">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              VERZEL PASS // {ticket.ticketCode}
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
              HMAC-256
            </span>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-inner border border-border-subtle mb-3">
                <QRCodeSVG
                  value={ticket.qrPayload}
                  size={220}
                  level="M"
                  includeMargin={false}
                  className={ticket.status !== "ACTIVE" ? "opacity-25" : ""}
                />
              </div>
              {getStatusBadge()}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2 text-text-primary">{event.title}</h2>
              <div className="space-y-1.5 text-xs text-text-muted flex flex-col items-center">
                {entryTimeLabel && (
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{entryTimeLabel}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Início: {formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.locationName} &bull; {event.city}</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-main p-4 rounded-xl border border-border-subtle space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <span className="text-text-muted font-mono uppercase">Setor</span>
                <span className="font-bold text-text-primary">{sector.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <span className="text-text-muted font-mono uppercase">Assento</span>
                <span className="font-bold text-text-primary">
                  {seat ? `${seat.row.toUpperCase()}${seat.number}` : "Pista (S/ Assento)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-mono uppercase">Código</span>
                <span className="font-mono text-primary font-bold text-sm tracking-wider">{ticket.ticketCode}</span>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2.5 p-3.5 bg-primary/10 rounded-xl text-xs text-primary/90 border border-primary/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <p className="leading-relaxed">
                Este ingresso confere direito a uma única entrada. Apresente este voucher com o brilho da tela no máximo para leitura óptica no scanner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
