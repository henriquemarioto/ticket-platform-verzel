# Diagramas de Arquitetura C4 Model

Este documento contém os diagramas detalhados do C4 Model em sintaxe **Mermaid** versionada.

---

## 1. C4 Nível 1: Contexto de Sistema

```mermaid
C4Context
    title Diagrama de Contexto de Sistema - Plataforma de Ingressos

    Person(customer, "Cliente / Comprador", "Busca eventos, seleciona assentos no mapa, efetua checkout e gerencia ingressos.")
    Person(organizer, "Organizador de Eventos", "Cria eventos com setores de pista ou assentos numerados e monitora vendas.")
    Person(gatekeeper, "Operador de Portaria", "Valida ingressos na entrada via scanner de câmera WebRTC ou código manual.")

    System(system, "Plataforma de Eventos & Ingressos", "Sistema unificado para comercialização sem double-booking e validação anti-fraude.")

    System_Ext(tmdb, "TMDb API", "Catálogo internacional de filmes, pôsteres e sinopses.")
    System_Ext(ticketmaster, "Ticketmaster Discovery API", "Catálogo global de concertos e shows ao vivo.")

    Rel(customer, system, "Navega, reserva e compra", "HTTPS")
    Rel(organizer, system, "Publica eventos e setores", "HTTPS")
    Rel(gatekeeper, system, "Valida QR Codes e ingressos", "HTTPS / WebRTC")

    Rel(system, tmdb, "Consulta filmes populares", "HTTPS REST")
    Rel(system, ticketmaster, "Consulta shows e atrações", "HTTPS REST")
```

---

## 2. C4 Nível 2: Contêineres da Solução (Vercel + Supabase)

```mermaid
C4Container
    title Diagrama de Contêineres da Aplicação (Vercel + Supabase)

    Person(user, "Usuário", "Organizador, Cliente ou Portaria")

    Container_Boundary(c1, "Aplicação Serverless (Hospedada na Vercel)") {
        Container(frontend, "Frontend SPA / SSR", "Next.js App Router, React, TailwindCSS", "Renderiza a interface do usuário, mapas de assentos e leitor de câmera.")
        Container(backend, "Backend API & Server Actions", "Node.js Serverless, Route Handlers, Zod, Crypto", "Executa lógica de negócios, validação RBAC, assinatura HMAC e controle de concorrência.")
    }

    Container_Boundary(c2, "Infraestrutura de Banco de Dados (Supabase)") {
        Container(pooler, "Supavisor Connection Pooler", "Transaction Mode (Porta 6543)", "Multiplexa e gerencia o pool de conexões das funções serverless.")
        ContainerDb(database, "PostgreSQL Engine", "PostgreSQL 16 (Porta 5432)", "Armazena eventos, setores, assentos com status de reserva, pedidos e ingressos.")
    }

    Rel(user, frontend, "Interage", "HTTPS")
    Rel(frontend, backend, "Dispara ações e requisições", "Internal / HTTPS")
    Rel(backend, pooler, "Executa transações e queries de runtime", "Prisma Client (DATABASE_URL :6543?pgbouncer=true)")
    Rel(pooler, database, "Conexões multiplexadas otimizadas", "TCP 5432")
    Rel(backend, database, "Migrações DDL e travas de schema", "Prisma CLI (DIRECT_URL :5432)")
```

