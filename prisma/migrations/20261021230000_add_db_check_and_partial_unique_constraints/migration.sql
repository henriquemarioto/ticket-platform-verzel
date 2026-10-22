-- 1. Garantia de Unicidade de Ingresso Ativo por Assento (Anti-Double-Sell no nível do banco)
-- Permite histórico de ingressos CANCELLED para o mesmo seatId, mas impede mais de 1 ingresso ACTIVE ou USED.
CREATE UNIQUE INDEX IF NOT EXISTS "tickets_active_seat_unique"
ON "tickets" ("seatId")
WHERE "seatId" IS NOT NULL AND "status" IN ('ACTIVE', 'USED');

-- 2. Garantia de Capacidade e Preço nos Setores (Impede overselling / saldo negativo)
ALTER TABLE "sectors"
ADD CONSTRAINT "sectors_capacity_and_price_check"
CHECK (
  "totalCapacity" > 0
  AND "availableCapacity" >= 0
  AND "availableCapacity" <= "totalCapacity"
  AND "price" >= 0
);

-- 3. Consistência de Bloqueio Temporário em Assentos Numerados
ALTER TABLE "seats"
ADD CONSTRAINT "seats_reserved_consistency_check"
CHECK (
  "status" != 'RESERVED'
  OR ("reservedById" IS NOT NULL AND "reservedUntil" IS NOT NULL)
);

-- 4. Invariantes Positivas em Itens de Reserva e Pedidos
ALTER TABLE "reservation_items"
ADD CONSTRAINT "reservation_items_positive_check"
CHECK ("quantity" > 0 AND "unitPrice" >= 0);

ALTER TABLE "orders"
ADD CONSTRAINT "orders_total_amount_check"
CHECK ("totalAmount" >= 0);

-- 5. Consistência Temporal de Eventos
ALTER TABLE "events"
ADD CONSTRAINT "events_timeline_check"
CHECK (
  "entryStartTime" <= "eventDate"
  AND ("endDate" IS NULL OR "endDate" > "eventDate")
);
