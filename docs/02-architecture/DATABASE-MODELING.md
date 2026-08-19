# Modelagem do Banco de Dados e Conexão Prisma ORM

Este documento detalha o schema definitivo do banco de dados relacional (PostgreSQL), os tipos enumerados, índices de concorrência e o padrão singleton para gerenciamento de conexões.

---

## 1. Conexão Singleton (`src/lib/prisma.ts`)

No ambiente de desenvolvimento do Next.js com *Hot-Module Replacement (HMR)*, novas conexões podem ser abertas a cada recompilação. O padrão singleton impede o esgotamento do pool de conexões do PostgreSQL:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 2. Schema Declarativo Completo (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ORGANIZER
  CUSTOMER
  GATEKEEPER
}

enum EventCategory {
  SHOW
  MOVIE
  THEATER
  FESTIVAL
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CLOSED
  FINISHED
  CANCELLED
}

enum SectorType {
  GENERAL_ADMISSION // Pista (quantidade livre até capacidade)
  NUMBERED_SEATS    // Assentos numerados por fileira/número
}

enum SeatStatus {
  AVAILABLE
  RESERVED          // Bloqueio temporário (10 minutos)
  SOLD
  BLOCKED
}

enum OrderStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum TicketStatus {
  ACTIVE
  USED
  CANCELLED
}

enum ReservationStatus {
  PENDING
  COMPLETED
  EXPIRED
  CANCELLED
}

enum ValidationResult {
  VALID
  ALREADY_USED
  WRONG_EVENT
  INVALID_CODE
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role      @default(CUSTOMER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  events       Event[]
  orders       Order[]
  tickets      Ticket[]
  reservations Reservation[]
  validations  TicketValidationLog[]

  @@map("users")
}

model Event {
  id           String        @id @default(cuid())
  title        String
  description  String
  category     EventCategory @default(SHOW)
  isAdult      Boolean       @default(false)
  bannerUrl    String
  locationName String
  city         String
  eventDate    DateTime
  status       EventStatus   @default(PUBLISHED)
  externalId   String?
  
  organizerId  String
  organizer    User          @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  
  sectors      Sector[]
  tickets      Ticket[]
  reservations Reservation[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("events")
}

model Sector {
  id                String     @id @default(cuid())
  eventId           String
  event             Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name              String
  type              SectorType @default(GENERAL_ADMISSION)
  price             Float
  totalCapacity     Int
  availableCapacity Int

  seats             Seat[]
  tickets           Ticket[]
  reservationItems  ReservationItem[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@map("sectors")
}

model Seat {
  id               String            @id @default(cuid())
  sectorId         String
  sector           Sector            @relation(fields: [sectorId], references: [id], onDelete: Cascade)
  row              String            // "A", "B", "C"
  number           Int               // 1, 2, 3...
  status           SeatStatus        @default(AVAILABLE)
  
  reservedById     String?
  reservedUntil    DateTime?
  
  tickets          Ticket[]
  reservationItems ReservationItem[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@unique([sectorId, row, number])
  @@map("seats")
}

model Reservation {
  id          String            @id @default(cuid())
  userId      String
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  status      ReservationStatus @default(PENDING)
  expiresAt   DateTime
  
  items       ReservationItem[]
  orders      Order[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@map("reservations")
}

model ReservationItem {
  id            String      @id @default(cuid())
  reservationId String
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  sectorId      String
  sector        Sector      @relation(fields: [sectorId], references: [id], onDelete: Cascade)
  seatId        String?
  seat          Seat?       @relation(fields: [seatId], references: [id], onDelete: SetNull)
  quantity      Int         @default(1)
  unitPrice     Float

  @@map("reservation_items")
}

model Order {
  id             String       @id @default(cuid())
  customerId     String
  customer       User         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  reservationId  String?
  reservation    Reservation? @relation(fields: [reservationId], references: [id], onDelete: SetNull)
  totalAmount    Float
  status         OrderStatus  @default(PENDING)
  paymentMethod  String       @default("SIMULATED_CREDIT_CARD")
  paymentDetails String?
  
  tickets        Ticket[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@map("orders")
}

model Ticket {
  id             String       @id @default(cuid())
  orderId        String
  order          Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  eventId        String
  event          Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  sectorId       String
  sector         Sector       @relation(fields: [sectorId], references: [id], onDelete: Cascade)
  seatId         String?
  seat           Seat?        @relation(fields: [seatId], references: [id], onDelete: SetNull)
  customerId     String
  customer       User         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  ticketCode     String       @unique
  qrPayload      String       @unique // Payload completo assinado: v1:{ticketCode}:{eventId}:{timestamp}:{signature}
  secureToken    String       @unique // Assinatura HMAC-SHA256 para QR Code
  shareToken     String       @unique // Token público seguro para link compartilhado
  status         TicketStatus @default(ACTIVE)
  usedAt         DateTime?

  validationLogs TicketValidationLog[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@map("tickets")
}

model TicketValidationLog {
  id           String           @id @default(cuid())
  ticketId     String?
  ticket       Ticket?          @relation(fields: [ticketId], references: [id], onDelete: SetNull)
  gatekeeperId String
  gatekeeper   User             @relation(fields: [gatekeeperId], references: [id], onDelete: Cascade)
  result       ValidationResult
  rawPayload   String
  message      String
  validatedAt  DateTime         @default(now())

  @@map("ticket_validation_logs")
}
```

---

## 3. Estratégia de Conexões em Nuvem: Supabase (Supavisor) & Vercel (Serverless)

Quando a aplicação Next.js é hospedada na **Vercel** e o banco de dados PostgreSQL no **Supabase**, a arquitetura de execução serverless exige cuidados rigorosos para evitar o esgotamento do pool de conexões (*Connection Pool Starvation* / erro `FATAL: remaining connection slots are reserved for non-replication superuser connections` ou `Error: Can't reach database server`).

### 3.1 O Problema da Concorrência Serverless
- Cada função serverless (Server Component, Route Handler ou Server Action) na Vercel pode ser instanciada sob demanda em nós isolados (*lambdas* efêmeras).
- Em picos de tráfego (ex: abertura de vendas de um grande show), centenas de instâncias serverless podem nascer simultaneamente.
- Se cada instância abrir uma conexão direta e permanente na porta padrão `5432` do PostgreSQL, o limite de conexões nativas do banco (`max_connections`, geralmente entre 60 e 100 conexões em instâncias de entrada) é atingido em segundos, travando a plataforma.

```mermaid
flowchart TD
    subgraph Vercel["Vercel Serverless (Next.js)"]
        L1["Serverless Lambda 1"]
        L2["Serverless Lambda 2"]
        LN["Serverless Lambda N..."]
    end

    subgraph Supabase["Supabase Cloud"]
        Pooler["Supavisor Connection Pooler<br/><b>Porta 6543 (Transaction Mode)</b><br/>Multiplexação de Conexões"]
        Direct["PostgreSQL Direct Connection<br/><b>Porta 5432 (Session Mode)</b><br/>DDL & Migrations"]
        Engine[("PostgreSQL Engine<br/>max_connections limitado")]
    end

    L1 -->|"DATABASE_URL<br/>?pgbouncer=true&connection_limit=1"| Pooler
    L2 -->|"DATABASE_URL<br/>?pgbouncer=true&connection_limit=1"| Pooler
    LN -->|"DATABASE_URL<br/>?pgbouncer=true&connection_limit=1"| Pooler
    
    Pooler -->|"Poucas conexões ativas reutilizadas"| Engine

    CLI["Prisma CLI / CI-CD<br/>(prisma migrate deploy)"] -->|"DIRECT_URL<br/>Porta 5432 (Advisory Locks, DDL)"| Direct
    Direct --> Engine
```

---

### 3.2 Dual Connection: `DATABASE_URL` vs `DIRECT_URL`

Para conciliar a execução em escala serverless com a segurança nas migrações de schema, o Prisma ORM e o Supabase operam com **duas URLs distintas**:

| Variável | Porta | Modo Supabase | Finalidade | Parâmetros Obrigatórios |
| :--- | :--- | :--- | :--- | :--- |
| **`DATABASE_URL`** | `6543` | **Transaction Mode** (Supavisor / PgBouncer) | **Runtime da Aplicação** (Next.js na Vercel). Todas as consultas, mutations e transações ACID da aplicação passam pelo pooler. | `?pgbouncer=true&connection_limit=1` |
| **`DIRECT_URL`** | `5432` | **Session Mode** / Conexão Direta | **Prisma CLI & Migrations** (`prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, `prisma db seed`, `prisma studio`). | Nenhum parâmetro extra de pooler |

#### Por que o Runtime usa `DATABASE_URL` (Porta 6543 / Modo Transação)?
1. **Multiplexação**: O pooler mantém uma pequena quantidade de conexões reais com o PostgreSQL e as aloca dinamicamente apenas durante a execução de cada query ou bloco transacional.
2. **`?pgbouncer=true`**: Instrui o Prisma Client a **desativar *prepared statements*** em nível de conexão e desabilitar recursos de sessão que causariam erros fatais no PgBouncer/Supavisor em modo transação.
3. **`&connection_limit=1`**: Garante que cada *lambda* da Vercel utilize no máximo 1 slot de conexão simultâneo por instância, permitindo que a aplicação suporte picos massivos de concorrência sem esgotar o Supavisor.

#### Por que as Migrações exigem `DIRECT_URL` (Porta 5432 / Conexão Direta)?
1. **Advisory Locks (`pg_advisory_lock`)**: O comando `prisma migrate deploy` e `prisma migrate dev` utiliza travas consultivas no PostgreSQL em nível de sessão para garantir que duas instâncias de build/CI não executem migrações simultaneamente.
2. **DDL Transacional e Shadow Database**: Alterações de tabelas (`ALTER TABLE`, `CREATE INDEX`, manipulação de tipos `ENUM`) criam estados de sessão e transações estendidas incompatíveis com o pooler em modo transação da porta 6543.
3. Se você tentar rodar `npx prisma migrate deploy` através da porta `6543`, o Prisma acusará erro de prepared statement ou falha de lock de migração.

---

### 3.3 Configuração de Variáveis de Ambiente

#### A. Ambiente Local (Docker Compose)
No ambiente local, ambas as variáveis podem apontar para o PostgreSQL rodando no Docker local:
```env
# .env (Ambiente Local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ticket_platform?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/ticket_platform?schema=public"
```

#### B. Ambiente de Produção / Staging (Vercel + Supabase)
No painel da Vercel (*Project Settings -> Environment Variables*), configure:
```env
# URL com Connection Pooler Supavisor (Porta 6543) - Utilizada pelo Prisma Client no runtime Serverless
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# URL Direta (Porta 5432) - Utilizada pela CLI do Prisma para executar 'prisma migrate deploy'
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

---

### 3.4 Boas Práticas do Singleton Prisma para Vercel Serverless

1. **Instância Global (`src/lib/prisma.ts`)**: Mantém a referência do `PrismaClient` no objeto `globalThis`. Em execuções quentes (*warm starts* da Vercel), a mesma conexão estabelecida é reutilizada, eliminando o *overhead* do handshake TCP/TLS a cada requisição.
2. **Sem `prisma.$disconnect()` manual em rotas**: Nunca chame `$disconnect()` ao final de Route Handlers ou Server Actions, pois isso forçaria novas conexões a cada requisição subsequente, anulando os ganhos do pooler.
3. **Log enxuto em produção**: Em produção, configure `log: ["error"]` para reduzir o consumo de memória e I/O das lambdas.

