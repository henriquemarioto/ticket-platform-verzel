"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export interface OrganizerCannotBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

export function OrganizerCannotBuyModal({
  isOpen,
  onClose,
  eventId,
}: OrganizerCannotBuyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSwitchToCustomer = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const returnPath = eventId ? `/events/${eventId}` : "";
      router.push(`/login?returnUrl=${returnPath}`);
      router.refresh();
    } catch {
      router.push(`/login?returnUrl=/events/${eventId || ""}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="bg-warning/15 p-4 rounded-full mb-4 text-warning ring-8 ring-warning/5">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-2">
          Conta de Organizador
        </h3>

        <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-sm">
          Contas de organizador não têm permissão para comprar ingressos. Para adquirir ingressos para este evento, por favor acesse com uma conta de cliente.
        </p>

        <div className="flex flex-col-reverse sm:flex-row w-full gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSwitchToCustomer}
            loading={isLoading}
          >
            Entrar como Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
