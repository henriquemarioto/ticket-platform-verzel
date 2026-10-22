import { EventEmitter } from "events";

export type SeatEvent =
  | {
      type: "SEAT_STATUS_CHANGED";
      eventId: string;
      seats: Array<{
        id: string;
        status: string;
        reservedUntil?: string | null;
        reservedById?: string | null;
        row?: string;
        number?: number;
      }>;
    }
  | {
      type: "SECTOR_CAPACITY_CHANGED";
      eventId: string;
      sectorId: string;
      availableCapacity: number;
    };

const globalForSeatEvents = globalThis as unknown as {
  seatEventEmitter: EventEmitter | undefined;
};

export const seatEventEmitter =
  globalForSeatEvents.seatEventEmitter ?? new EventEmitter();

// Evita warnings de memory leak com múltiplos ouvintes SSE simultâneos
seatEventEmitter.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalForSeatEvents.seatEventEmitter = seatEventEmitter;
}

export function subscribeToSeatEvents(
  eventId: string,
  callback: (event: SeatEvent) => void
): () => void {
  const eventName = `seat-events:${eventId}`;
  seatEventEmitter.on(eventName, callback);
  return () => {
    seatEventEmitter.off(eventName, callback);
  };
}

export function publishSeatEvent(eventId: string, event: SeatEvent): void {
  const eventName = `seat-events:${eventId}`;
  seatEventEmitter.emit(eventName, event);
}

export interface ReservationSeatEffectItem {
  seatId: string | null;
  sectorId: string;
  seat?: { row: string; number: number } | null;
}

/**
 * Notificador centralizado de efeitos SSE em reservas e vendas.
 * Emite um único evento SEAT_STATUS_CHANGED e eventos deduplicados de SECTOR_CAPACITY_CHANGED.
 */
export async function broadcastReservationEffects(params: {
  eventId: string;
  items: ReservationSeatEffectItem[];
  seatStatus: "SOLD" | "AVAILABLE" | "RESERVED";
  reservedUntil?: string | null;
  reservedById?: string | null;
  fetchSectorCapacity: (sectorId: string) => Promise<number | null>;
}): Promise<void> {
  const { eventId, items, seatStatus, reservedUntil, reservedById, fetchSectorCapacity } = params;

  // 1. Assentos numerados
  const seatItems = items.filter((item) => item.seatId);
  if (seatItems.length > 0) {
    publishSeatEvent(eventId, {
      type: "SEAT_STATUS_CHANGED",
      eventId,
      seats: seatItems.map((item) => ({
        id: item.seatId!,
        status: seatStatus,
        reservedUntil: reservedUntil ?? null,
        reservedById: reservedById ?? null,
        row: item.seat?.row,
        number: item.seat?.number,
      })),
    });
  }

  // 2. Setores de pista (deduplicados por sectorId)
  const gaSectorIds = Array.from(new Set(items.filter((item) => !item.seatId).map((item) => item.sectorId)));
  for (const sectorId of gaSectorIds) {
    const availableCapacity = await fetchSectorCapacity(sectorId);
    if (availableCapacity !== null && availableCapacity !== undefined) {
      publishSeatEvent(eventId, {
        type: "SECTOR_CAPACITY_CHANGED",
        eventId,
        sectorId,
        availableCapacity,
      });
    }
  }
}
