# Visão Geral da Arquitetura de Software

Este documento define a arquitetura técnica da **Plataforma de Eventos e Ingressos**, estruturada segundo os padrões de engenharia de software de alta performance, desacoplamento e o modelo **C4 Model**.

---

## 1. Stack Tecnológica e Camadas

| Camada | Tecnologia | Papel e Justificativa |
| :--- | :--- | :--- |
| **Framework Fullstack** | **Next.js 16 (App Router)** | Unifica Front-End e Back-End (Server Components, Server Actions e Route Handlers) em TypeScript unificado, otimizado para deploy na **Vercel**. |
| **Linguagem** | **TypeScript 5.x (`strict: true`)** | Tipagem estrita de contratos de API, schemas e entidades de banco. |
| **Banco de Dados & ORM** | **PostgreSQL (Supabase) + Prisma ORM** | Persistência relacional robusta com suporte total a enums nativos, constraints de unicidade e transações ACID. Protegido por **Supavisor Connection Pooler** para escala serverless. |
| **Hospedagem & Nuvem** | **Vercel (App/API) + Supabase (DB/Pooler)** | Infraestrutura serverless com alta disponibilidade, conexão multiplexada na porta 6543 (`DATABASE_URL`) e conexão direta na porta 5432 (`DIRECT_URL`) para migrações. |
| **Segurança & Sessão** | **Stateless JWT + Cookies HttpOnly** | Tokens assinados digitalmente com `AUTH_SECRET`, imunes a extração client-side via scripts (XSS). |
| **Criptografia Anti-Fraude** | **HMAC-SHA256 (Node `crypto`)** | Assinatura digital criptográfica dos QR Codes para prevenção de falsificação. |
| **Validação de Dados** | **Zod** | Validação isomórfica (tanto no client-side quanto no server-side). |
| **Estilização & UI** | **TailwindCSS 4 + Tokens Semânticos HSL** | Design System moderno com `@theme`, alta performance e anti-AI slop. |

---

## 2. Modelo C4 (Contexto e Contêineres)

### 2.1 C4 Nível 1: Diagrama de Contexto de Sistema

```mermaid
C4Context
    title Diagrama de Contexto de Sistema (C4 Nível 1) - Plataforma de Ingressos

    Person(customer, "Cliente / Comprador", "Busca eventos, reserva assentos e adquire ingressos.")
    Person(organizer, "Organizador", "Cria eventos, configura setores e analisa vendas.")
    Person(gatekeeper, "Operador de Portaria", "Escaneia e valida ingressos no local do evento.")

    System(ticketSystem, "Plataforma de Eventos & Ingressos", "Permite publicação, venda sem double-booking e validação criptográfica de ingressos.")

    System_Ext(tmdb, "TMDb API", "Catálogo global de filmes e posters.")
    System_Ext(ticketmaster, "Ticketmaster API", "Catálogo global de shows e eventos ao vivo.")

    Rel(customer, ticketSystem, "Navega, reserva assentos e realiza pagamento", "HTTPS")
    Rel(organizer, ticketSystem, "Publica eventos e acompanha métricas", "HTTPS")
    Rel(gatekeeper, ticketSystem, "Escaneia QR Code e valida entradas", "HTTPS / WebRTC")

    Rel(ticketSystem, tmdb, "Consulta catálogo de filmes", "HTTPS REST")
    Rel(ticketSystem, ticketmaster, "Consulta catálogo de shows", "HTTPS REST")
```

### 2.2 C4 Nível 2: Diagrama de Contêineres

```mermaid
C4Container
    title Diagrama de Contêineres (C4 Nível 2) - Topologia Vercel + Supabase

    Person(user, "Usuário (Org / Cliente / Portaria)", "Acessa via navegador desktop ou mobile.")

    Container_Boundary(c1, "Plataforma de Ingressos (Hospedada na Vercel)") {
        Container(app, "Web App (Next.js)", "React, Next App Router, TailwindCSS 4", "Interface responsiva com SSR e Client Components.")
        Container(api, "API Layer (Route Handlers & Server Actions)", "Next.js Backend Serverless, Node.js", "Processa regras de negócio, autenticação JWT, validação Zod e HMAC.")
    }

    Container_Boundary(c2, "Infraestrutura de Banco de Dados (Supabase)") {
        Container(pooler, "Supavisor Connection Pooler", "Transaction Mode (Porta 6543)", "Multiplexa e protege o PostgreSQL contra esgotamento de conexões.")
        ContainerDb(db, "Banco de Dados Relacional", "PostgreSQL Engine (Porta 5432)", "Armazena usuários, eventos, setores, assentos, pedidos, ingressos e logs.")
    }

    System_Ext(externalApis, "APIs Externas (TMDb / Ticketmaster)", "Catálogo de mídia.")

    Rel(user, app, "Navega e interage", "HTTPS")
    Rel(app, api, "Chamadas de API / Server Actions", "Internal / HTTPS")
    Rel(api, pooler, "Consultas e Transações em Runtime", "Prisma Client (DATABASE_URL :6543?pgbouncer=true)")
    Rel(pooler, db, "Conexões multiplexadas", "TCP 5432")
    Rel(api, db, "Migrações e DDL via CLI", "Prisma CLI (DIRECT_URL :5432)")
    Rel(api, externalApis, "Busca atrações externas", "HTTPS REST")
```

---

## 3. Modelo de Entidade e Relacionamento (Schema Prisma)

O schema do banco modela as seguintes entidades fundamentais:

```mermaid
erDiagram
    User ||--o{ Event : "organiza"
    User ||--o{ Order : "realiza"
    User ||--o{ Ticket : "possui"
    User ||--o{ Reservation : "solicita"
    User ||--o{ TicketValidationLog : "valida (gatekeeper)"
    
    Event ||--|{ Sector : "contem"
    Event ||--o{ Ticket : "emite"
    Event ||--o{ Reservation : "vincula"
    
    Sector ||--o{ Seat : "possui (se numerado)"
    Sector ||--o{ Ticket : "pertence"
    Sector ||--o{ ReservationItem : "bloqueia"
    
    Seat ||--o{ Ticket : "vinculado"
    Seat ||--o{ ReservationItem : "reserva"
    
    Reservation ||--|{ ReservationItem : "contem"
    Reservation ||--o{ Order : "origina"
    Order ||--|{ Ticket : "agrupa"
    Ticket ||--o{ TicketValidationLog : "registra logs"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role
        datetime createdAt
    }

    Event {
        string id PK
        string title
        string description
        enum category
        string bannerUrl
        string locationName
        string city
        datetime eventDate
        enum status
        string externalId "opcional / nullable"
        string organizerId FK
    }

    Sector {
        string id PK
        string eventId FK
        string name
        enum type
        float price
        int totalCapacity
        int availableCapacity
    }

    Seat {
        string id PK
        string sectorId FK
        string row
        int number
        enum status
        string reservedById
        datetime reservedUntil
    }

    Reservation {
        string id PK
        string userId FK
        string eventId FK
        enum status
        datetime expiresAt
    }

    ReservationItem {
        string id PK
        string reservationId FK
        string sectorId FK
        string seatId "FK opcional (null para pista)"
        int quantity
        float unitPrice
    }

    Order {
        string id PK
        string customerId FK
        string reservationId "FK opcional"
        float totalAmount
        enum status
        string paymentMethod
        string paymentDetails "opcional / nullable"
    }

    Ticket {
        string id PK
        string orderId FK
        string eventId FK
        string sectorId FK
        string seatId "FK opcional (null para pista)"
        string customerId FK
        string ticketCode UK
        string qrPayload UK
        string secureToken UK
        string shareToken UK
        enum status
        datetime usedAt
    }

    TicketValidationLog {
        string id PK
        string ticketId "FK opcional"
        string gatekeeperId FK
        enum result
        string rawPayload
        string message
        datetime validatedAt
    }
```

> **Notas de Integridade e Regras do Banco**:
> - **Índice Único Composto de Assento**: A tabela `Seat` possui restrição única composta `@@unique([sectorId, row, number])` garantindo que não existam poltronas duplicadas no mesmo setor.
> - **Opcionalidade de Assento (`seatId`)**: Em setores de Pista (`GENERAL_ADMISSION`), os campos `seatId` em `Ticket` e `ReservationItem` são gravados como `null`, operando exclusivamente por cota de capacidade (`availableCapacity`).

---

## 4. Próximos Documentos da Camada de Arquitetura

- 📊 **Diagramas Detalhados**: [`docs/02-architecture/diagrams/`](./diagrams/)
- 📝 **Architecture Decision Records (ADRs)**: [`docs/02-architecture/ADRS.md`](./ADRS.md)
