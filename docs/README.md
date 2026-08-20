# Documentação da Plataforma de Eventos e Ingressos

Bem-vindo à documentação oficial de engenharia, arquitetura e produto da **Plataforma de Eventos e Ingressos** (Desafio Elite Dev).

A documentação está organizada de forma sequencial e modular nas seguintes pastas:

---

## 🗂️ Estrutura de Diretórios Consolidada

```text
docs/
├── README.md                          # Índice Mestre de toda a documentação
│
├── 00-overview/
│   ├── README.md                      # Visão geral do produto, objetivos, papéis e pilares
│   ├── DOMAIN-DICTIONARY.md           # Glossário Ubiquitous Language (DDD)
│   └── ROADMAP.md                     # Roadmap de entregas e matriz de rastreabilidade
│
├── 01-use-cases/
│   ├── README.md                      # Mapa geral e navegação dos 30 Casos de Uso
│   ├── 01-AUTH-AND-ACCESS.md          # UC01 a UC05: Autenticação, Registro, RBAC, Seed e Logout
│   ├── 02-EVENTS-AND-CATALOG.md       # UC06 a UC10: TMDb, Ticketmaster, Pista, Assentos e Gestão
│   ├── 03-SALES-AND-TICKETS.md        # UC11 a UC20: Vitrine, Reserva Lock, TTL, Checkout, QR HMAC e Link
│   ├── 04-GATE-AND-CHECKIN.md         # UC21 a UC24: Dashboard Portaria, Scanner WebRTC e Validação 4 Estados
│   └── 05-ANALYTICS-AND-ADVANCED.md   # UC25 a UC30: Filtros, Analytics, Cancelamento, Realtime e Testes
│
├── 02-architecture/
│   ├── ARCHITECTURE-OVERVIEW.md       # Visão C4 Model (Contexto e Contêineres) e Stack Tecnológica
│   ├── DATABASE-MODELING.md           # Schema Prisma, pooler Supavisor (Porta 6543) e conexão direta (Porta 5432)
│   ├── PROJECT-STRUCTURE.md           # Estrutura modular de pastas Next.js 16 App Router com Edge Proxy
│   ├── ADRS.md                        # Architecture Decision Records (ADRs 0001 a 0009)
│   └── diagrams/                      # Diagramas C4, ERD e Fluxos de Dados
│
├── 03-design/
│   └── DESIGN-SYSTEM.md               # Tokens Kinetic Pulse, Diretrizes Anti-AI Slop, Componentes Atômicos e Fluxos
│
├── 04-api-and-integrations/
│   ├── OPENAPI-SPEC.yaml              # Especificação Swagger / OpenAPI 3.0 testável com todos os endpoints
│   └── API-AND-INTEGRATIONS.md        # Integrações TMDb/Ticketmaster/Maps, Gateway Simulado e Schemas Zod
│
├── 05-devops-and-operations/
│   ├── ENVIRONMENT-AND-INFRASTRUCTURE.md # Setup Local (Docker Porta 5433), Nuvem (Vercel + Supabase) e CI/CD
│   └── OPERATIONS-RUNBOOK.md          # Runbook de Rollback de Migrações (DIRECT_URL) e Logs
│
├── 06-quality-and-testing/
│   └── TEST-PLAN-AND-CRITERIA.md      # Pirâmide de testes, cenários de concorrência ACID, DoR e DoD
│
├── PROJECT-EVOLUTION-AND-STORY.md     # Relato técnico: visão inicial, mudanças e decisões
└── CHALLENGE.md                       # Enunciado original do desafio técnico
```

---

---

## 📋 Matriz de Requisitos: Obrigatórios vs. Opcionais

Para facilitar a avaliação e garantir total conformidade com o edital do **Desafio Elite Dev**, os requisitos estão categorizados explicitamente abaixo:

### 1. ✅ Requisitos Mínimos (Obrigatórios)

| Categoria     | Requisito Obrigatório                        | O que foi planejado e especificado                                                                    | Documento de Referência                                                        |
| :------------ | :------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Front-End** | **Navegação & Vitrine**                      | Vitrine de eventos publicados (shows/filmes) com data, local e preço.                                 | [`03-SALES-AND-TICKETS.md`](./01-use-cases/03-SALES-AND-TICKETS.md#uc11)       |
| **Front-End** | **Gestão do Organizador**                    | Criação e gerenciamento de eventos com definição de capacidade e preços.                              | [`02-EVENTS-AND-CATALOG.md`](./01-use-cases/02-EVENTS-AND-CATALOG.md#uc08)     |
| **Front-End** | **Fluxo de Reserva (Pista e/ou Assentos)**   | Suporte completo a **Pista** (quantidade) e **Mapa de Assentos** (cinema/teatro).                     | [`03-SALES-AND-TICKETS.md`](./01-use-cases/03-SALES-AND-TICKETS.md#uc13)       |
| **Front-End** | **Pagamento Simulado**                       | Checkout com simulação explícita de **Aprovação** e **Recusa** de pagamento.                          | [`03-SALES-AND-TICKETS.md`](./01-use-cases/03-SALES-AND-TICKETS.md#uc16)       |
| **Front-End** | **Área "Meus Ingressos"**                    | Exibição de ingressos adquiridos e seus respectivos vouchers com QR Code.                             | [`03-SALES-AND-TICKETS.md`](./01-use-cases/03-SALES-AND-TICKETS.md#uc18)       |
| **Front-End** | **Tela de Portaria (4 Estados)**             | Interface de validação com 4 retornos claros: `VÁLIDO`, `JÁ UTILIZADO`, `EVENTO ERRADO` e `INVÁLIDO`. | [`04-GATE-AND-CHECKIN.md`](./01-use-cases/04-GATE-AND-CHECKIN.md#uc24)         |
| **Front-End** | **Scanner WebRTC + Digitação**               | Leitura contínua pela câmera do dispositivo e digitação manual como contingência.                     | [`04-GATE-AND-CHECKIN.md`](./01-use-cases/04-GATE-AND-CHECKIN.md#uc22)         |
| **Back-End**  | **Integração Externa (TMDb / Ticketmaster)** | Consumo de APIs públicas para importação de filmes (TMDb) e shows (Ticketmaster).                     | [`API-AND-INTEGRATIONS.md`](./04-api-and-integrations/API-AND-INTEGRATIONS.md) |
| **Back-End**  | **Autenticação RBAC (3 Papéis)**             | Perfis `ORGANIZER`, `CUSTOMER` e `GATEKEEPER` com cookies `httpOnly` seguros.                         | [`01-AUTH-AND-ACCESS.md`](./01-use-cases/01-AUTH-AND-ACCESS.md#uc01)           |
| **Back-End**  | **Anti-Double Booking**                      | Garantia matemática de que o mesmo assento ou cota não pode ser vendido 2x.                           | [`ADRS.md`](./02-architecture/ADRS.md)                                         |
| **Back-End**  | **QR Code Criptografado (Anti-Forjamento)**  | Assinatura digital HMAC-SHA256 para impedir falsificação de ingressos.                                | [`03-SALES-AND-TICKETS.md`](./01-use-cases/03-SALES-AND-TICKETS.md#uc19)       |
| **Back-End**  | **Link Público Compartilhável**              | Geração de link público tokenizado para visualização de ingresso individual.                          | [`03-SALES-AND-TICKETS.md`](./01-use-cases/03-SALES-AND-TICKETS.md#uc20)       |
| **Back-End**  | **Anti-Duplicidade na Entrada**              | Bloqueio atômico para impedir que o mesmo ingresso entre mais de uma vez.                             | [`04-GATE-AND-CHECKIN.md`](./01-use-cases/04-GATE-AND-CHECKIN.md#uc24)         |
| **Dados**     | **Seed Automatizado**                        | 1 Organizador, 2 Clientes, 1 Portaria e 1 Evento completo pré-populados.                              | [`01-AUTH-AND-ACCESS.md`](./01-use-cases/01-AUTH-AND-ACCESS.md#uc04)           |

---

### 2. 🌟 Requisitos Opcionais & Diferenciais de Excelência (Bônus)

| Diferencial Opcional                         | Valor Agregado ao Projeto                                                                                                            |   Status no Projeto    | Documento de Referência                                                                             |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------: | :-------------------------------------------------------------------------------------------------- |
| **Deploy em Produção na Nuvem**              | **+1 Ponto na Nota Final**: Aplicação ao vivo na **Vercel** ([ticket-platform-verzel.vercel.app](https://ticket-platform-verzel.vercel.app/)) + **Supabase PostgreSQL** com Connection Pooler Supavisor na porta 6543. | ✅ **Concluído** | [`ENVIRONMENT-AND-INFRASTRUCTURE.md`](./05-devops-and-operations/ENVIRONMENT-AND-INFRASTRUCTURE.md) |
| **Orquestração Docker Compose**              | Inicialização completa da aplicação e banco local com um único comando (`docker compose up`).                                        |  ✅ **Especificado**   | [`05-ANALYTICS-AND-ADVANCED.md`](./01-use-cases/05-ANALYTICS-AND-ADVANCED.md#uc29)                  |
| **Bateria de Testes Automatizados**          | Testes unitários, de concorrência ACID (anti-double booking) e validação HMAC.                                                       |  ✅ **Especificado**   | [`TEST-PLAN-AND-CRITERIA.md`](./06-quality-and-testing/TEST-PLAN-AND-CRITERIA.md)                   |
| **Filtros Multicritério**                    | Busca combinada por categoria, faixa de preço, intervalo de datas e cidade.                                                          |  ✅ **Especificado**   | [`05-ANALYTICS-AND-ADVANCED.md`](./01-use-cases/05-ANALYTICS-AND-ADVANCED.md#uc25)                  |
| **Dashboard do Organizador**                 | Painel com KPIs financeiros, faturamento consolidado e taxa de ocupação.                                                           |  ✅ **Especificado**   | [`05-ANALYTICS-AND-ADVANCED.md`](./01-use-cases/05-ANALYTICS-AND-ADVANCED.md#uc26)                  |
| **Cancelamento com Devolução ao Estoque**    | Cancelamento voluntário pelo cliente com estorno simulado e liberação imediata da poltrona.                                          |  ✅ **Especificado**   | [`05-ANALYTICS-AND-ADVANCED.md`](./01-use-cases/05-ANALYTICS-AND-ADVANCED.md#uc27)                  |
| **Sincronização em Tempo Real (WebSockets)** | Atualização instantânea do mapa de poltronas para múltiplos compradores simultâneos.                                                 |   💡 **Arquitetado**   | [`05-ANALYTICS-AND-ADVANCED.md`](./01-use-cases/05-ANALYTICS-AND-ADVANCED.md#uc28)                  |
| **Especificação OpenAPI/Swagger 3.0**        | Documentação interativa e testável de todos os endpoints REST da plataforma.                                                         |     ✅ **Pronto**      | [`OPENAPI-SPEC.yaml`](./04-api-and-integrations/OPENAPI-SPEC.yaml)                                  |

---

### 3. 🚫 Fora de Escopo Explícito (Dispensados pelo Edital)

Conforme orientação direta do enunciado do desafio, os seguintes itens **não fazem parte do escopo**:

- ❌ Emissão de Nota Fiscal.
- ❌ Revenda de ingressos (_marketplace peer-to-peer_ secundário) entre usuários.
- ❌ Aplicativo nativo para smartphones (iOS / Android nativos) — _o web app é responsivo e mobile-first_.
- ❌ Fluxo de recuperação de senha por e-mail (esqueci minha senha).
- ❌ Envio de ingressos ou transacionais por SMTP / E-mail.

---

## 🧭 Guias Rápidos de Navegação

- 📖 **Relato Técnico & Evolução do Projeto**: [`PROJECT-EVOLUTION-AND-STORY.md`](./PROJECT-EVOLUTION-AND-STORY.md).
- 🚀 **Setup & Execução Local**: [`05-devops-and-operations/ENVIRONMENT-AND-INFRASTRUCTURE.md`](./05-devops-and-operations/ENVIRONMENT-AND-INFRASTRUCTURE.md).
- 🏗️ **Arquitetura & Banco de Dados**: [`02-architecture/ARCHITECTURE-OVERVIEW.md`](./02-architecture/ARCHITECTURE-OVERVIEW.md) e [`02-architecture/DATABASE-MODELING.md`](./02-architecture/DATABASE-MODELING.md).
- 🎨 **Design System & UI/UX**: [`03-design/DESIGN-SYSTEM.md`](./03-design/DESIGN-SYSTEM.md).
- 🔌 **Contratos de API & OpenAPI**: [`04-api-and-integrations/OPENAPI-SPEC.yaml`](./04-api-and-integrations/OPENAPI-SPEC.yaml) e [`04-api-and-integrations/API-AND-INTEGRATIONS.md`](./04-api-and-integrations/API-AND-INTEGRATIONS.md).
- 🎟️ **Casos de Uso de Negócio**: [`01-use-cases/README.md`](./01-use-cases/README.md).
- 🗺️ **Roadmap & Fases de Desenvolvimento**: [`00-overview/ROADMAP.md`](./00-overview/ROADMAP.md).
