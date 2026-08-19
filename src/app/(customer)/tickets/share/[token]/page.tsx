import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateSharePasscode } from "@/lib/crypto";
import { formatEventDateRange } from "@/lib/utils/date-formatters";
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
    title: `Ingresso: ${ticket.event.title} | Ticket Platform`,
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
    <div className="min-h-screen bg-bg-main py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-primary mb-2">Ticket Platform Verzel</h1>
          <p className="text-text-muted">Voucher Digital</p>
        </div>

        <div className="bg-bg-surface shadow-sm rounded-2xl overflow-hidden shadow-xl relative">
          {ticket.status !== "ACTIVE" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none p-6 text-center">
              <span className="text-4xl font-black uppercase text-white transform -rotate-12 mb-4 drop-shadow-lg">
                {ticket.status === "USED" ? "Utilizado" : "Cancelado"}
              </span>
              <p className="text-white text-sm bg-black/60 p-3 rounded-lg">
                {ticket.status === "USED" 
                  ? `Este ingresso já foi validado na portaria em ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleString("pt-BR") : "data desconhecida"}.`
                  : "Este ingresso foi cancelado pelo titular da compra e não é mais válido para entrada."}
              </p>
            </div>
          )}

          <div 
            className="w-full h-48 bg-cover bg-center shadow-sm" 
            style={{ backgroundImage: `url(${event.bannerUrl})` }} 
          />
          
          <div className="p-6">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
                <QRCodeSVG
                  value={ticket.qrPayload}
                  size={240}
                  level="M"
                  includeMargin={false}
                  className={ticket.status !== "ACTIVE" ? "opacity-30" : ""}
                />
              </div>
              {getStatusBadge()}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">{event.title}</h2>
              <div className="space-y-2 text-sm text-text-muted flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.locationName} • {event.city}</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-main p-4 rounded-xl shadow-sm space-y-3 text-sm">
              <div className="flex justify-between items-center pb-3">
                <span className="text-text-muted">Setor</span>
                <span className="font-medium">{sector.name}</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="text-text-muted">Assento</span>
                <span className="font-medium">
                  {seat ? `${seat.row}${seat.number}` : "Pista"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Código</span>
                <span className="font-mono text-primary font-bold text-lg">{ticket.ticketCode}</span>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-primary/10 rounded-xl text-xs text-primary/90 shadow-sm ring-1 ring-primary/20">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Este ingresso confere direito a uma única entrada. Não compartilhe o link, não tire prints e apresente esta tela na portaria com o brilho do celular no máximo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
