# Roadmap de Entregas e Marcos (Fases 1, 2 e 3)

Este documento estabelece o cronograma de desenvolvimento e a matriz de rastreabilidade para o projeto, separando a **estruturação da base técnica (Fase 1)** do **desenvolvimento dos casos de uso de negócio (Fase 2 - Core)** e dos **diferenciais de escala (Fase 3 - Opcionais e Excelência)**.

---

## 1. Visão Macro das Três Fases

```mermaid
gantt
    title Cronograma de Desenvolvimento e Marcos
    dateFormat  YYYY-MM-DD
    section Fase 1: Fundação Técnica & Infra
    Setup Next.js 16 & TypeScript Estrito   :done, f1_1, 2026-08-14, 1d
    Dockerfile & Docker Compose PostgreSQL  :active, f1_2, 2026-08-14, 1d
    Layout Raiz, ToastProvider & Tema HSL   :f1_3, 2026-08-15, 1d
    Design System & Componentes Atômicos    :f1_4, 2026-08-15, 1d
    Modelagem Prisma ORM & Conexão Singleton:f1_5, 2026-08-16, 1d
    section Fase 2: Casos de Uso Core
    UC01 a UC05: Autenticação, RBAC & Logout:f2_1, 2026-08-17, 2d
    UC06 a UC10: Catálogos TMDb/TM & Eventos:f2_2, 2026-08-19, 2d
    UC11 a UC15: Vitrine, Reserva & Lock TTL:f2_3, 2026-08-21, 2d
    UC16 a UC20: Checkout, Vouchers & QR HMAC:f2_4, 2026-08-23, 2d
    UC21 a UC24: Portaria WebRTC, Manual & 4 Estados:f2_5, 2026-08-24, 2d
    section Fase 3: Escala & Diferenciais
    UC25 a UC28: Filtros, Analytics, Cancel & WebSockets:f3_1, 2026-08-26, 2d
    UC29 a UC30: Docker Compose & Bateria de Testes:f3_2, 2026-08-28, 2d
    Deploy Produção & Documentação IA       :f3_3, 2026-08-29, 1d
```

---

## 2. Detalhamento dos Marcos

### 🏗️ Marco 1: Fase 1 - Estruturação da Base Técnica e Infraestrutura
- [x] **Setup & Estrutura**: Setup Next.js 16 (App Router), TypeScript `strict`, ESLint e Prettier ([`docs/02-architecture/PROJECT-STRUCTURE.md`](../02-architecture/PROJECT-STRUCTURE.md)).
- [x] **Infraestrutura**: Containerização Docker e topologia Supabase + Vercel com pooler Supavisor ([`docs/05-devops-and-operations/ENVIRONMENT-AND-INFRASTRUCTURE.md`](../05-devops-and-operations/ENVIRONMENT-AND-INFRASTRUCTURE.md)).
- [x] **Design System & Tema**: Layout raiz, `ToastProvider`, paleta Kinetic Pulse, tokens HEX no `@theme` e biblioteca atômica de UI ([`docs/03-design/DESIGN-SYSTEM.md`](../03-design/DESIGN-SYSTEM.md)).
- [x] **Banco de Dados**: Modelagem `schema.prisma`, conexões dual-URL e client singleton ([`docs/02-architecture/DATABASE-MODELING.md`](../02-architecture/DATABASE-MODELING.md)).

### 🎯 Marco 2: Fase 2 - Desenvolvimento dos Casos de Uso Core (Obrigatórios)
- [x] **Módulo 1: Autenticação & Acesso (UC01 a UC05)**: [`docs/01-use-cases/01-AUTH-AND-ACCESS.md`](../01-use-cases/01-AUTH-AND-ACCESS.md)
  - [x] UC01: Autenticação e Login com Perfis RBAC
  - [x] UC02: Cadastro e Registro de Novos Usuários
  - [x] UC03: Controle de Acesso e Proteção de Rotas (RBAC via Edge Proxy)
  - [x] UC04: Pipeline de Carga de Dados de Teste (Seed)
  - [x] UC05: Encerramento de Sessão (Logout) e Invalidação de Cookie
- [x] **Módulo 2: Eventos e Catálogo (UC06 a UC10)**: [`docs/01-use-cases/02-EVENTS-AND-CATALOG.md`](../01-use-cases/02-EVENTS-AND-CATALOG.md)
  - [x] UC06: Integração e Busca de Filmes no Catálogo Externo TMDb com Fallback Mock
  - [x] UC07: Integração e Busca de Shows na Ticketmaster Discovery API com Fallback Mock
  - [x] UC08: Criação de Evento com Setor de Pista (Lotação Geral)
  - [x] UC09: Criação de Evento com Mapa de Assentos Numerados
  - [x] UC10: Gestão, Edição e Controle de Status de Eventos
- [x] **Módulo 3: Venda, Reserva e Ingressos (UC11 a UC20)**: [`docs/01-use-cases/03-SALES-AND-TICKETS.md`](../01-use-cases/03-SALES-AND-TICKETS.md)
  - [x] UC11: Vitrine Pública, Navegação e Busca Rápida de Eventos
  - [x] UC12: Visualização Detalhada do Evento com Google Maps Embed Gratuito
  - [x] UC13: Seleção de Quantidade e Reserva em Setores de Pista
  - [x] UC14: Seleção no Mapa de Assentos com Bloqueio Atômico Anti-Double Booking
  - [x] UC15: Expiração por Tempo Limite (TTL) e Liberação de Assentos (Lazy Expiration)
  - [x] UC16: Checkout e Simulação de Pagamento Aprovado
  - [x] UC17: Checkout e Simulação de Pagamento Recusado
  - [x] UC18: Visualização e Gestão no Painel Meus Ingressos (Abas Ativos / Histórico)
  - [x] UC19: Geração e Assinatura Criptográfica de QR Code (HMAC-SHA256)
  - [x] UC20: Compartilhamento por Link Público Tokenizado com Passcode HMAC
- [x] **Módulo 4: Portaria e Controle de Acesso (UC21 a UC24)**: [`docs/01-use-cases/04-GATE-AND-CHECKIN.md`](../01-use-cases/04-GATE-AND-CHECKIN.md)
  - [x] UC21: Seleção de Evento e Painel Operacional da Portaria
  - [x] UC22: Validação via Scanner Contínuo de Câmera (WebRTC com áudio e vibração)
  - [x] UC23: Validação por Digitação Manual de Código
  - [x] UC24: Motor de Validação da Portaria e os 4 Estados Claros (com Anti-Duplicação Concorrente)

### 🌟 Marco 3: Fase 3 - Diferenciais de Escala e Excelência (Opcionais)
- [ ] **Módulo 5: Analytics e Recursos Avançados (UC25 a UC30)**: [`docs/01-use-cases/05-ANALYTICS-AND-ADVANCED.md`](../01-use-cases/05-ANALYTICS-AND-ADVANCED.md)
  - UC25: Busca e Filtros Avançados Multicritério
  - UC26: Painel Analítico e Métricas do Organizador
  - UC27: Cancelamento de Ingresso com Devolução ao Estoque
  - UC28: Sincronização em Tempo Real do Mapa via WebSockets
  - UC29: Containerização e Orquestração com Docker Compose
  - UC30: Bateria Completa de Testes Automatizados
- [ ] Publicação em produção na nuvem (Vercel + Supabase/PostgreSQL com pooler Supavisor).

---

## 3. Matriz de Cobertura e Rastreabilidade do Desafio

| Requisito do Edital | Nível de Prioridade | Marco de Entrega | Documento Consolidado |
| :--- | :---: | :---: | :--- |
| **Setup Next.js, TypeScript e Layout** | Base | Fase 1 | [`PROJECT-STRUCTURE.md`](../02-architecture/PROJECT-STRUCTURE.md) |
| **Design System e Componentes Base** | Base | Fase 1 | [`DESIGN-SYSTEM.md`](../03-design/DESIGN-SYSTEM.md) |
| **Modelagem de Banco & Conexões** | Base | Fase 1 | [`DATABASE-MODELING.md`](../02-architecture/DATABASE-MODELING.md) |
| **Autenticação, Registro, RBAC e Seed** | Obrigatório | Fase 2 | [`01-AUTH-AND-ACCESS.md`](../01-use-cases/01-AUTH-AND-ACCESS.md) |
| **TMDb, Ticketmaster e Gestão de Eventos** | Obrigatório | Fase 2 | [`02-EVENTS-AND-CATALOG.md`](../01-use-cases/02-EVENTS-AND-CATALOG.md) |
| **Vitrine, Reserva, Lock ACID, Checkout e QR** | Obrigatório | Fase 2 | [`03-SALES-AND-TICKETS.md`](../01-use-cases/03-SALES-AND-TICKETS.md) |
| **Portaria, WebRTC e 4 Estados de Check-in** | Obrigatório | Fase 2 | [`04-GATE-AND-CHECKIN.md`](../01-use-cases/04-GATE-AND-CHECKIN.md) |
| **Analytics, Cancelamento, Docker e Testes** | Opcional | Fase 3 | [`05-ANALYTICS-AND-ADVANCED.md`](../01-use-cases/05-ANALYTICS-AND-ADVANCED.md) |

