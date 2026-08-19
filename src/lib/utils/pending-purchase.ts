import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface PendingGeneralAdmission {
  type: "GENERAL_ADMISSION";
  eventId: string;
  sectorId: string;
  quantity: number;
}

export interface PendingNumberedSeats {
  type: "NUMBERED_SEATS";
  eventId: string;
  sectorId: string;
  seatIds: string[];
}

export type PendingPurchaseData = PendingGeneralAdmission | PendingNumberedSeats;

export interface ToastHandlers {
  success: (msg: string) => void;
  warning?: (msg: string) => void;
  error: (msg: string) => void;
  info?: (msg: string) => void;
}

const STORAGE_KEY = "verzel_pending_purchase";

/**
 * Processa qualquer intenção de compra armazenada no sessionStorage após o login/cadastro.
 */
export async function processPendingPurchase(
  userRole: string | undefined | null,
  defaultRedirectUrl: string,
  router: AppRouterInstance | { push: (url: string) => void; refresh: () => void },
  toast: ToastHandlers
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const rawPending = window.sessionStorage.getItem(STORAGE_KEY);
  if (!rawPending) {
    router.push(defaultRedirectUrl);
    router.refresh();
    return;
  }

  let pendingData: PendingPurchaseData | null = null;
  try {
    pendingData = JSON.parse(rawPending);
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    router.push(defaultRedirectUrl);
    router.refresh();
    return;
  }

  if (!pendingData) {
    router.push(defaultRedirectUrl);
    router.refresh();
    return;
  }

  // Se o usuário logado for Organizador ou Portaria, não pode comprar ingressos
  if (userRole && userRole !== "CUSTOMER") {
    window.sessionStorage.removeItem(STORAGE_KEY);
    if (toast.warning) {
      toast.warning("Contas de organizador/portaria não podem adquirir ingressos.");
    }
    router.push(defaultRedirectUrl);
    router.refresh();
    return;
  }

  try {
    if (pendingData.type === "GENERAL_ADMISSION") {
      const res = await fetch("/api/reservations/general-admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectorId: pendingData.sectorId,
          quantity: pendingData.quantity,
        }),
      });

      const data = await res.json();
      window.sessionStorage.removeItem(STORAGE_KEY);

      if (!res.ok) {
        toast.error(data.error || "Não foi possível concluir sua reserva pendente.");
        router.push(defaultRedirectUrl);
        router.refresh();
        return;
      }

      const reservationId = data.reservation?.id || data.reservationId;
      toast.success("Reserva realizada com sucesso! Redirecionando para o pagamento...");
      router.push(`/checkout?reservationId=${reservationId}`);
      router.refresh();
      return;
    }

    if (pendingData.type === "NUMBERED_SEATS") {
      const res = await fetch("/api/seats/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: pendingData.eventId,
          sectorId: pendingData.sectorId,
          seatIds: pendingData.seatIds,
        }),
      });

      const data = await res.json();
      window.sessionStorage.removeItem(STORAGE_KEY);

      if (!res.ok) {
        toast.error(
          data.error || "Os assentos selecionados anteriormente não estão mais disponíveis."
        );
        router.push(defaultRedirectUrl);
        router.refresh();
        return;
      }

      const reservationId = data.reservationId || data.reservation?.id;
      toast.success("Assentos reservados com sucesso! Redirecionando para o pagamento...");
      router.push(`/checkout?reservationId=${reservationId}`);
      router.refresh();
      return;
    }
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    toast.error("Erro ao processar a reserva após o login.");
    router.push(defaultRedirectUrl);
    router.refresh();
  }
}
