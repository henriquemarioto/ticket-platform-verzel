# Diagrama Entidade-Relacionamento (ERD)

Este documento documenta todas as entidades, campos e relações do banco de dados relacional (PostgreSQL).

---

## 1. Diagrama ERD

```mermaid
erDiagram
    User ||--o{ Event : "cria"
    User ||--o{ Order : "realiza"
    User ||--o{ Ticket : "possui"
    User ||--o{ Reservation : "solicita"
    User ||--o{ TicketValidationLog : "valida (gatekeeper)"
    
    Event ||--|{ Sector : "possui"
    Event ||--o{ Ticket : "emite"
    Event ||--o{ Reservation : "vincula"
    
    Sector ||--o{ Seat : "contem"
    Sector ||--o{ Ticket : "pertence"
    Sector ||--o{ ReservationItem : "bloqueia"
    
    Seat ||--o{ Ticket : "alocado"
    Seat ||--o{ ReservationItem : "reserva"
    
    Reservation ||--|{ ReservationItem : "contem"
    Reservation ||--o{ Order : "origina"
    Order ||--|{ Ticket : "contem"
    Ticket ||--o{ TicketValidationLog : "auditoria"

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        Role role
        DateTime createdAt
        DateTime updatedAt
    }

    Event {
        String id PK
        String title
        String description
        EventCategory category
        String bannerUrl
        String locationName
        String city
        DateTime eventDate
        EventStatus status
        String externalId
        String organizerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Sector {
        String id PK
        String eventId FK
        String name
        SectorType type
        Float price
        Int totalCapacity
        Int availableCapacity
        DateTime createdAt
        DateTime updatedAt
    }

    Seat {
        String id PK
        String sectorId FK
        String row
        Int number
        SeatStatus status
        String reservedById
        DateTime reservedUntil
        DateTime createdAt
        DateTime updatedAt
    }

    Reservation {
        String id PK
        String userId FK
        String eventId FK
        ReservationStatus status
        DateTime expiresAt
        DateTime createdAt
        DateTime updatedAt
    }

    ReservationItem {
        String id PK
        String reservationId FK
        String sectorId FK
        String seatId "FK nullable (nulo para setor de pista)"
        Int quantity
        Float unitPrice
    }

    Order {
        String id PK
        String customerId FK
        String reservationId "FK nullable"
        Float totalAmount
        OrderStatus status
        String paymentMethod
        String paymentDetails "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    Ticket {
        String id PK
        String orderId FK
        String eventId FK
        String sectorId FK
        String seatId "FK nullable (nulo para setor de pista)"
        String customerId FK
        String ticketCode UK
        String qrPayload UK
        String secureToken UK
        String shareToken UK
        TicketStatus status
        DateTime usedAt
        DateTime createdAt
        DateTime updatedAt
    }

    TicketValidationLog {
        String id PK
        String ticketId "FK nullable"
        String gatekeeperId FK
        ValidationResult result
        String rawPayload
        String message
        DateTime validatedAt
    }
```

---

## 2. Índices Compostos e Regras de Integridade

- **Restrição de Cadeira Única (`Seat`)**:
  - `@@unique([sectorId, row, number])`: Impede fisicamente no banco que a mesma poltrona (mesma fileira e número) seja criada duas vezes no mesmo setor.
- **Opcionalidade de Assento para Pista (`GENERAL_ADMISSION`)**:
  - As tabelas `tickets` e `reservation_items` utilizam `seatId` como anulável (`nullable`), pois setores de pista operam pelo controle de cota numérica decrementando `availableCapacity` em `sectors`.
- **Prevenção de Falsificação e Rastreabilidade (`Ticket`)**:
  - `ticketCode`, `qrPayload`, `secureToken` e `shareToken` possuem índices únicos (`UK`), garantindo unicidade criptográfica em cada voucher emitido.

