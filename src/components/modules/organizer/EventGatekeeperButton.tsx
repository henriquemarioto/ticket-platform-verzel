"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { EventGatekeepersModal } from "./EventGatekeepersModal";

interface EventGatekeeperButtonProps {
  eventId: string;
  eventTitle: string;
}

export function EventGatekeeperButton({
  eventId,
  eventTitle,
}: EventGatekeeperButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs text-text-primary hover:text-primary"
        title="Gerenciar equipe de portaria"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        Portaria
      </Button>

      <EventGatekeepersModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
      />
    </>
  );
}
