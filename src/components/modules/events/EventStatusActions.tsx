"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { EventStatus } from "@prisma/client";

interface EventStatusActionsProps {
  eventId: string;
  currentStatus: EventStatus;
}

export function EventStatusActions({ eventId, currentStatus }: EventStatusActionsProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleUpdateStatus = async (newStatus: EventStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar status");
      }

      toast.success("Status do evento atualizado.");

      setIsModalOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case "DRAFT":
        return [{ label: "Publicar Evento", status: "PUBLISHED", variant: "primary" as const }];
      case "PUBLISHED":
        return [{ label: "Encerrar Vendas", status: "CLOSED", variant: "danger" as const }];
      case "CLOSED":
        return [
          { label: "Reabrir Vendas", status: "PUBLISHED", variant: "primary" as const },
          { label: "Finalizar Evento", status: "FINISHED", variant: "secondary" as const }
        ];
      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
        Alterar Status
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Alterar Status do Evento"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            O status atual do evento é <strong className="text-text-primary">{currentStatus}</strong>. Selecione o novo status abaixo:
          </p>
          
          <div className="flex flex-col gap-2">
            {actions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                loading={isLoading}
                onClick={() => handleUpdateStatus(action.status as EventStatus)}
                className="w-full justify-center"
              >
                {action.label}
              </Button>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
