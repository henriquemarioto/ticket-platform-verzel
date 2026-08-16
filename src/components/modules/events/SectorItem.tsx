"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketSelector } from "./TicketSelector";
import { SeatMap } from "./SeatMap";
import { Sector } from "@prisma/client";

interface SectorItemProps {
  sector: Sector;
  eventId: string;
}

export function SectorItem({ sector, eventId }: SectorItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSoldOut = sector.availableCapacity <= 0;
  const isNumbered = sector.type === "NUMBERED_SEATS";

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(sector.price);

  return (
    <div className="flex flex-col border-b border-subtle last:border-0 p-4 transition-colors hover:bg-surface-hover/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="mb-4 sm:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-text-primary">{sector.name}</h3>
            {isSoldOut ? (
              <Badge variant="danger" className="text-xs">Esgotado</Badge>
            ) : (
              <Badge variant="success" className="text-xs">Disponível</Badge>
            )}
          </div>
          <p className="text-sm text-text-muted">
            Tipo: {isNumbered ? "Numerado" : "Pista Livre"}
          </p>
          {!isSoldOut && (
            <p className="text-xs text-text-muted mt-1">
              {sector.availableCapacity} ingressos restantes
            </p>
          )}
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
          <span className="text-xl font-bold text-primary">{formattedPrice}</span>
          <Button
            variant={isSoldOut ? "secondary" : (isExpanded ? "outline" : "primary")}
            disabled={isSoldOut}
            className="w-full sm:w-auto"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isSoldOut ? "Indisponível" : (isExpanded ? "Cancelar" : "Selecionar")}
          </Button>
        </div>
      </div>

      {isExpanded && !isSoldOut && (
        <div className="mt-6 border-t border-subtle pt-6">
          {isNumbered ? (
            <SeatMap eventId={eventId} sectorId={sector.id} price={sector.price} />
          ) : (
            <TicketSelector
              sectorId={sector.id}
              price={sector.price}
              availableCapacity={sector.availableCapacity}
            />
          )}
        </div>
      )}
    </div>
  );
}
