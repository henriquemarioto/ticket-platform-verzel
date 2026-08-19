"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketSelector } from "./TicketSelector";
import { SeatMap } from "./SeatMap";
import { Sector } from "@prisma/client";
import { Modal } from "@/components/ui/modal";
import { OrganizerCannotBuyModal } from "./OrganizerCannotBuyModal";

interface SectorItemProps {
  sector: Sector;
  eventId: string;
  currentUserRole?: string | null;
}

export function SectorItem({ sector, eventId, currentUserRole }: SectorItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOrganizerModalOpen, setIsOrganizerModalOpen] = useState(false);

  const isSoldOut = sector.availableCapacity <= 0;
  const isNumbered = sector.type === "NUMBERED_SEATS";

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(sector.price);

  const handleToggleSelect = () => {
    if (currentUserRole === "ORGANIZER") {
      setIsOrganizerModalOpen(true);
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col last:border-0 py-4 first:pt-0 last:pb-0 transition-colors hover:bg-surface-hover/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-text-primary text-sm">{sector.name}</h3>
          </div>
          <p className="text-xs text-text-muted mb-2">
            {isNumbered ? "Numerado" : "Pista Livre"}
          </p>
          <span className="text-sm font-bold text-text-primary">{formattedPrice}</span>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {isSoldOut ? (
            <Badge variant="danger" className="text-[10px] px-1.5 py-0">Esgotado</Badge>
          ) : (
            <Button
              variant={isExpanded && !isNumbered ? "outline" : "primary"}
              className="h-10 px-4 text-md w-full sm:w-auto"
              onClick={handleToggleSelect}
            >
              {isExpanded && !isNumbered ? "Cancelar" : "Selecionar"}
            </Button>
          )}
        </div>
      </div>

      {isExpanded && !isSoldOut && (
        isNumbered ? (
          <Modal
            isOpen={isExpanded}
            onClose={() => setIsExpanded(false)}
            title={`Selecionar Assento - ${sector.name}`}
            className="max-w-4xl w-full"
          >
            <SeatMap
              eventId={eventId}
              sectorId={sector.id}
              price={sector.price}
              currentUserRole={currentUserRole}
            />
          </Modal>
        ) : (
          <div className="mt-4 pt-4">
            <TicketSelector
              sectorId={sector.id}
              price={sector.price}
              availableCapacity={sector.availableCapacity}
              currentUserRole={currentUserRole}
              eventId={eventId}
            />
          </div>
        )
      )}

      <OrganizerCannotBuyModal
        isOpen={isOrganizerModalOpen}
        onClose={() => setIsOrganizerModalOpen(false)}
        eventId={eventId}
      />
    </div>
  );
}
