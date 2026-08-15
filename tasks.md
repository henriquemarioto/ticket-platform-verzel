# Plano de Tarefas e Checklist de Implementação (`tasks.md`)

Este documento rastreia a execução sistemática das tarefas de engenharia da **Plataforma de Eventos e Ingressos**, seguindo o fluxo obrigatório estipulado em [`AGENTS.md`](./AGENTS.md) e a matriz de rastreabilidade em [`docs/00-overview/ROADMAP.md`](./docs/00-overview/ROADMAP.md).

---

## 🏗️ Fase 1: Fundação Técnica, Ambiente e Design System

- [ ] **Task 1.1: Inicialização do Workspace Next.js & TypeScript com TailwindCSS 4**
  - [ ] Criar projeto Next.js 16 (App Router) com TypeScript estrito (`strict: true`).
  - [ ] Configurar path alias `@/*` no `tsconfig.json`.
  - [ ] Configurar TailwindCSS 4 com `@import "tailwindcss";` e `prettier-plugin-tailwindcss`.
  - [ ] Critério de Aceite: `npm run build` executa sem erros de compilação ou linter.

- [ ] **Task 1.2: Infraestrutura Local Docker**
  - [ ] Criar `docker-compose.yml` com serviço PostgreSQL 16 Alpine e volume de persistência.
  - [ ] Criar `.env.example` com todas as variáveis obrigatórias documentadas (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `QR_HMAC_SECRET`, `TMDB_API_KEY`, `TICKETMASTER_API_KEY`).
  - [ ] Critério de Aceite: `docker compose up -d postgres` inicializa o banco na porta 5432.

- [ ] **Task 1.3: Modelagem Declarativa Prisma e Conexões Dual-URL**
  - [ ] Criar `prisma/schema.prisma` com os enums e modelos (`User`, `Event`, `Sector`, `Seat`, `Reservation`, `ReservationItem`, `Order`, `Ticket`, `TicketValidationLog`).
  - [ ] Configurar `DATABASE_URL` (pooler) e `DIRECT_URL` (migrações).
  - [ ] Implementar singleton do Prisma em `src/lib/prisma.ts` ancorado no `globalThis`.
  - [ ] Executar migração inicial (`npx prisma migrate dev --name init`).
  - [ ] Critério de Aceite: Tabelas e enums criados no PostgreSQL local com integridade referencial.

- [ ] **Task 1.4: Design System & Componentes Atômicos UI (TailwindCSS 4 + @theme)**
  - [ ] Configurar tokens semânticos HSL no bloco `@theme` em `src/app/globals.css`.
  - [ ] Implementar componentes base em `src/components/ui/`:
    - [ ] `Button` (variantes: primary, secondary, danger, outline, ghost; suporte a loading e disabled).
    - [ ] `Input` (estados de erro Zod, anel de foco e ícones).
    - [ ] `Badge` (estados: success, warning, danger, neutral).
    - [ ] `Modal` (backdrop blur, acessibilidade com tecla Escape e trava de scroll).
    - [ ] `ToastProvider` & hook `useToast` (feedback: success, error, warning, info).
    - [ ] `Skeleton` (indicadores pulsantes para prevenção de CLS).
  - [ ] Critério de Aceite: Componentes renderizam visualmente refinados conforme [`docs/03-design/DESIGN-SYSTEM.md`](./docs/03-design/DESIGN-SYSTEM.md).

- [ ] **Task 1.5: Layout Raiz, Navbar e Quick Role Switcher**
  - [ ] Implementar `src/app/layout.tsx` com `ToastProvider`, fonte `Plus Jakarta Sans` e tema escuro.
  - [ ] Implementar `Navbar` responsiva e `Footer`.
  - [ ] Criar componente auxiliar `QuickRoleSwitcher` (atalho no rodapé/header para alternar entre Organizador, Cliente 1, Cliente 2 e Portaria).
  - [ ] Critério de Aceite: Navegação fluida em telas mobile, tablet e desktop.

---

## 🎯 Fase 2: Casos de Uso Core (Obrigatórios)

### Módulo 1: Autenticação, RBAC e Carga de Testes (UC01 a UC05)
- [ ] **Task 2.1: Serviços de Criptografia de Senha e Sessão JWT**
  - [ ] Implementar `src/lib/auth.ts` com hash bcrypt/argon2 e geração/verificação de JWT stateless (`jose`).
  - [ ] Implementar helpers para manipulação de cookies `httpOnly`, `SameSite=Lax` e `Secure`.
- [ ] **Task 2.2: Login de Usuários com RBAC (UC01)**
  - [ ] Implementar Route Handler `POST /api/auth/login`.
  - [ ] Implementar tela `src/app/(auth)/login/page.tsx` com formulário Zod e botões de atalho com credenciais pré-preenchidas.
  - [ ] Redirecionamento contextual: `ORGANIZER` -> `/organizer`, `GATEKEEPER` -> `/gatekeeper`, `CUSTOMER` -> `/` ou `returnUrl`.
- [ ] **Task 2.3: Cadastro de Novos Usuários (UC02)**
  - [ ] Implementar Route Handler `POST /api/auth/register` com validação de unicidade de e-mail.
  - [ ] Implementar tela `src/app/(auth)/register/page.tsx` com seleção de papel (`CUSTOMER` ou `ORGANIZER`).
- [ ] **Task 2.4: Middleware Edge RBAC e Proteção de Rotas (UC03)**
  - [ ] Implementar `src/middleware.ts` com validação de token e proteção por papel.
  - [ ] Injetar cabeçalhos downstream `x-user-id`, `x-user-role`, `x-user-email`.
  - [ ] Criar página personalizada `403 Forbidden` (`src/app/forbidden.tsx`).
- [ ] **Task 2.5: Script de Seed Automatizado e Idempotente (UC04)**
  - [ ] Criar `prisma/seed.ts` populando 1 Organizador, 2 Clientes, 1 Portaria e 1 Evento completo com Pista e 30 Assentos VIP numerados.
  - [ ] Configurar comando `npm run db:seed` no `package.json`.
- [ ] **Task 2.6: Logout e Invalidação de Sessão (UC05)**
  - [ ] Implementar Route Handler `POST /api/auth/logout`.
  - [ ] Integrar botão de logout na `Navbar` com limpeza de estado e feedback visual.

---

### Módulo 2: Integração Externa e Gestão de Eventos (UC06 a UC10)
- [ ] **Task 2.7: Integração TMDb com Catálogo Fallback Mock (UC06)**
  - [ ] Implementar Route Handler `GET /api/external-catalog/tmdb`.
  - [ ] Implementar catálogo mock embutido com filmes populares caso `TMDB_API_KEY` esteja ausente.
  - [ ] Integrar modal de busca debounced no formulário de eventos.
- [ ] **Task 2.8: Integração Ticketmaster com Catálogo Fallback Mock (UC07)**
  - [ ] Implementar Route Handler `GET /api/external-catalog/ticketmaster`.
  - [ ] Implementar catálogo mock embutido de shows/turnês caso `TICKETMASTER_API_KEY` esteja ausente.
  - [ ] Integrar modal de busca debounced no formulário de eventos.
- [ ] **Task 2.9: Criação de Evento com Setores de Pista (UC08)**
  - [ ] Implementar Route Handler `POST /api/events` com validação Zod.
  - [ ] Implementar formulário de criação em `src/app/(organizer)/organizer/events/create/page.tsx`.
- [ ] **Task 2.10: Criação de Evento com Mapa de Assentos Numerados (UC09)**
  - [ ] Adicionar gerador de grade de assentos por fileiras e poltronas (A1..A10, B1..B10...).
  - [ ] Persistir registros de `Seat` com status `AVAILABLE`.
- [ ] **Task 2.11: Painel de Gestão do Organizador (UC10)**
  - [ ] Implementar tela `src/app/(organizer)/organizer/page.tsx` listando eventos criados com badges de status e botão para novo evento.

---

### Módulo 3: Vitrine, Reserva Anti-Double Booking, Checkout e Ingressos (UC11 a UC20)
- [ ] **Task 2.12: Vitrine Pública de Eventos (UC11)**
  - [ ] Implementar `src/app/(customer)/page.tsx` com banner hero, pílulas de categoria e busca rápida.
  - [ ] Calcular `minPrice` dinâmico por setor.
- [ ] **Task 2.13: Visualização Detalhada do Evento (UC12)**
  - [ ] Implementar `src/app/(customer)/events/[id]/page.tsx` com sinopse, informações de local/data e tabela de setores.
- [ ] **Task 2.14: Reserva Atômica em Setores de Pista (UC13)**
  - [ ] Implementar Route Handler `POST /api/reservations/general-admission`.
  - [ ] Executar lock condicional decrementando `availableCapacity` e gerando registro `Reservation` (TTL 10m).
- [ ] **Task 2.15: Mapa de Assentos Interativo & Anti-Double Booking (UC14)**
  - [ ] Implementar componente interativo `SeatMap` com indicação de assentos livres, selecionados, em reserva e ocupados.
  - [ ] Implementar Route Handler `POST /api/seats/reserve` com transação atômica serializada (`WHERE status = 'AVAILABLE'`).
- [ ] **Task 2.16: Expiração de TTL e Liberação de Assentos (UC15)**
  - [ ] Implementar rotina de *lazy expiration* nas consultas de assentos (`GET /api/events/[id]/seats`).
  - [ ] Restaurar assentos expirados para `AVAILABLE` e devolver cotas de pista ao estoque.
- [ ] **Task 2.17: Checkout e Pagamento Simulado Aprovado (UC16)**
  - [ ] Implementar tela `src/app/(customer)/checkout/page.tsx` com cronômetro regressivo de 10 minutos sincronizado.
  - [ ] Implementar Route Handler `POST /api/checkout/process` com emissão transacional de `Order`, `Ticket` e conversão para `SOLD`.
  - [ ] Criar página de sucesso `src/app/(customer)/checkout/success/page.tsx`.
- [ ] **Task 2.18: Simulação de Pagamento Recusado (UC17)**
  - [ ] Adicionar botão explícito "Simular Pagamento Recusado" no checkout.
  - [ ] Registrar pedido como `REJECTED`, liberar assentos imediatamente e exibir feedback com botão de nova tentativa.
- [ ] **Task 2.19: Painel Meus Ingressos (UC18)**
  - [ ] Implementar tela `src/app/(customer)/my-tickets/page.tsx` listando vouchers ativos e passados com botões de ação.
- [ ] **Task 2.20: Geração e Assinatura HMAC de QR Code (UC19)**
  - [ ] Implementar `src/lib/crypto.ts` com assinatura HMAC-SHA256 (`v1:{ticketCode}:{eventId}:{timestamp}:{signature}`).
  - [ ] Renderizar QR Code em SVG de alta nitidez com nível de correção de erro `M`.
- [ ] **Task 2.21: Compartilhamento por Link Público Tokenizado (UC20)**
  - [ ] Implementar Route Handler `POST /api/tickets/[id]/share` gerando `shareToken`.
  - [ ] Implementar página pública `src/app/(customer)/tickets/share/[token]/page.tsx` acessível sem autenticação e sem dados confidenciais do titular.

---

### Módulo 4: Portaria e Controle de Acesso (UC21 a UC24)
- [ ] **Task 2.22: Painel Operacional da Portaria (UC21)**
  - [ ] Implementar tela `src/app/(gatekeeper)/gatekeeper/page.tsx` com seletor de evento e contadores de check-in em tempo real.
- [ ] **Task 2.23: Scanner Contínuo de Câmera WebRTC (UC22)**
  - [ ] Implementar leitor contínuo WebRTC com mira gráfica, alternância de câmera e feedback multissensorial (áudio e vibração).
  - [ ] Adicionar tratamento de permissões e contexto seguro (HTTPS / Localhost).
- [ ] **Task 2.24: Validação por Digitação Manual (UC23)**
  - [ ] Implementar aba de contingência com input alfanumérico e envio por Enter/botão.
- [ ] **Task 2.25: Motor de Validação e os 4 Estados Claros (UC24)**
  - [ ] Implementar Route Handler `POST /api/gate/validate` avaliando:
    - [ ] `VALID` (Acesso Liberado - Verde)
    - [ ] `ALREADY_USED` (Já Utilizado com data do 1º check-in - Laranja)
    - [ ] `WRONG_EVENT` (Evento Incorreto - Vermelho)
    - [ ] `INVALID_CODE` (Código Inválido ou HMAC Adulterado - Vermelho Escuro)
  - [ ] Garantir anti-duplicação concorrente entre múltiplas catracas (`updateMany WHERE status = 'ACTIVE'`).
  - [ ] Persistir histórico na tabela `ticket_validation_logs`.

---

## 🌟 Fase 3: Escala, Opcionais e Excelência (Bônus)

- [ ] **Task 3.1: Filtros Avançados Multicritério (UC25)**
  - [ ] Implementar gaveta de filtros por categoria, faixa de preço, intervalo de datas, cidade e ordenação dinâmica com sincronização na URL.
- [ ] **Task 3.2: Dashboard Analítico do Organizador (UC26)**
  - [ ] Exibir cards com faturamento total, taxa de ocupação dos setores e gráfico de vendas.
- [ ] **Task 3.3: Cancelamento de Ingressos com Devolução ao Estoque (UC27)**
  - [ ] Implementar botão de cancelamento voluntário pelo cliente no painel "Meus Ingressos", liberando imediatamente o assento/cota.
- [ ] **Task 3.4: Sincronização em Tempo Real (UC28)**
  - [ ] Atualização automática do mapa de assentos via polling inteligente ou Server-Sent Events/WebSockets.
- [ ] **Task 3.5: Dockerfile Multi-Stage e Empacotamento de Produção (UC29)**
  - [ ] Configurar `Dockerfile` otimizado em múltiplos estágios para build de produção.
- [ ] **Task 3.6: Bateria Completa de Testes Automatizados (UC30)**
  - [ ] Testes unitários de HMAC, RBAC e schemas Zod.
  - [ ] Testes de concorrência ACID anti-double booking.
  - [ ] Testes de validação de portaria nos 4 estados.
