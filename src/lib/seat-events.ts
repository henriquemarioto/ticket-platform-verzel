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
