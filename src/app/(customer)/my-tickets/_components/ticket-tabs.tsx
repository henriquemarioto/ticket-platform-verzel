"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TicketCard } from "./ticket-card";
import { Modal } from "@/components/ui/modal";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { TicketX } from "lucide-react";
import { Button } from "@/components/ui/button";

type TicketTabsProps = {
  upcomingTickets: any[];
  pastTickets: any[];
};

export function TicketTabs({ upcomingTickets, pastTickets }: TicketTabsProps) {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<any[]>(upcomingTickets);
  const [past, setPast] = useState<any[]>(pastTickets);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    setUpcoming(upcomingTickets);
    setPast(pastTickets);
  }, [upcomingTickets, pastTickets]);

  const handleCloseModal = async () => {
    setSelectedTicket(null);
    router.refresh();
    try {
      const res = await fetch("/api/my-tickets");
      const data = await res.json();
      if (data.success) {
        setUpcoming(data.upcomingTickets);
        setPast(data.pastTickets);
      }
    } catch (error) {
      console.error("Erro ao atualizar ingressos:", error);
    }
  };

  const activeTicketsList = activeTab === "upcoming" ? upcoming : past;

  return (
    <div>
      {/* Abas */}
      <div className="flex mb-6">
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative cursor-pointer ${
            activeTab === "upcoming" ? "text-primary" : "text-text-muted hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Próximos Eventos
          {upcoming.length > 0 && (
            <span className="ml-2 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
          {activeTab === "upcoming" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          className={`pb-4 px-4 font-medium text-sm transition-colors relative cursor-pointer ${
            activeTab === "past" ? "text-primary" : "text-text-muted hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Histórico / Passados
          {activeTab === "past" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Lista de Ingressos */}
      {activeTicketsList.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12 px-4 border border-dashed shadow-sm rounded-xl bg-bg-surface/50">
          <div className="bg-bg-surface p-3 rounded-full mb-4">
            <TicketX className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Nenhum ingresso encontrado
          </h3>
          <p className="text-text-muted mb-6 max-w-sm">
            Você ainda não possui ingressos {activeTab === "upcoming" ? "para os próximos eventos" : "no histórico"}.
          </p>
          {activeTab === "upcoming" && (
            <a href="/" className="inline-flex">
              <Button variant="outline">Explorar Eventos</Button>
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTicketsList.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onShowQR={setSelectedTicket} />
          ))}
        </div>
      )}

      {/* Modal do QR Code */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={handleCloseModal}
        title="QR Code para Entrada"
      >
        <p className="mb-2 text-center text-sm text-text-muted">
          Apresente este QR Code na tela do seu celular com o brilho no máximo ao chegar na portaria do evento.
        </p>
        {selectedTicket && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-xl shadow-inner mb-6">
              <QRCodeSVG
                value={selectedTicket.qrPayload || `v1:${selectedTicket.ticketCode}:${selectedTicket.eventId}`}
                size={240}
                level="M"
                includeMargin={false}
              />
            </div>
            
            <h3 className="font-semibold text-lg mb-1 text-center">{selectedTicket.event.title}</h3>
            
            <div className="flex flex-col gap-2 w-full mt-4 bg-bg-main p-4 rounded-lg shadow-sm text-sm">
              <div className="flex justify-between items-center pb-2">
                <span className="text-text-muted">Setor</span>
                <span className="font-medium">{selectedTicket.sector.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-text-muted">Assento</span>
                <span className="font-medium">
                  {selectedTicket.seat ? `${selectedTicket.seat.row}${selectedTicket.seat.number}` : "Pista"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Código</span>
                <span className="font-mono text-primary font-bold">{selectedTicket.ticketCode}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
