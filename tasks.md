# Plano de Tarefas e Checklist de Implementação (`tasks.md`)

Este documento rastreia a execução sistemática das tarefas de engenharia da **Plataforma de Eventos e Ingressos**, seguindo o fluxo obrigatório estipulado em [`AGENTS.md`](./AGENTS.md) e a matriz de rastreabilidade em [`docs/00-overview/ROADMAP.md`](./docs/00-overview/ROADMAP.md).

---

## 🏗️ Fase 1: Fundação Técnica, Ambiente e Design System

- [x] **Task 1.1: Inicialização do Workspace Next.js & TypeScript com TailwindCSS 4**
  - [x] Criar projeto Next.js 16 (App Router) com TypeScript estrito (`strict: true`).
  - [x] Configurar path alias `@/*` no `tsconfig.json`.
  - [x] Configurar TailwindCSS 4 com `@import "tailwindcss";` e `prettier-plugin-tailwindcss`.
  - [x] Critério de Aceite: `npm run build` executa sem erros de compilação ou linter.

- [x] **Task 1.2: Infraestrutura Local Docker**
  - [x] Criar `docker-compose.yml` com serviço PostgreSQL 16 Alpine e volume de persistência.
  - [x] Criar `.env.example` com todas as variáveis obrigatórias documentadas (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `QR_HMAC_SECRET`, `TMDB_API_KEY`, `TICKETMASTER_API_KEY`).
  - [x] Critério de Aceite: `docker compose up -d postgres` inicializa o banco na porta 5433 (modificado devido a conflito de porta).

- [x] **Task 1.3: Modelagem Declarativa Prisma e Conexões Dual-URL**
  - [x] Criar `prisma/schema.prisma` com os enums e modelos (`User`, `Event`, `Sector`, `Seat`, `Reservation`, `ReservationItem`, `Order`, `Ticket`, `TicketValidationLog`).
  - [x] Configurar `DATABASE_URL` (pooler) e `DIRECT_URL` (migrações).
  - [x] Implementar singleton do Prisma em `src/lib/prisma.ts` ancorado no `globalThis`.
  - [x] Executar migração inicial (`npx prisma migrate dev --name init`).
  - [x] Critério de Aceite: Tabelas e enums criados no PostgreSQL local com integridade referencial.

- [x] **Task 1.4: Design System & Componentes Atômicos UI (TailwindCSS 4 + @theme)**
  - [x] Configurar tokens semânticos HSL no bloco `@theme` em `src/app/globals.css`.
  - [x] Implementar componentes base em `src/components/ui/`:
    - [x] `Button` (variantes: primary, secondary, danger, outline, ghost; suporte a loading e disabled).
    - [x] `Input` (estados de erro Zod, anel de foco e ícones).
    - [x] `Badge` (estados: success, warning, danger, neutral).
    - [x] `Modal` (backdrop blur, acessibilidade com tecla Escape e trava de scroll).
    - [x] `ToastProvider` & hook `useToast` (feedback: success, error, warning, info).
    - [x] `Skeleton` (indicadores pulsantes para prevenção de CLS).
  - [x] Critério de Aceite: Componentes renderizam visualmente refinados conforme [`docs/03-design/DESIGN-SYSTEM.md`](./docs/03-design/DESIGN-SYSTEM.md).

- [x] **Task 1.5: Layout Raiz e Navbar**
  - [x] Implementar `src/app/layout.tsx` com `ToastProvider`, fonte `Plus Jakarta Sans` e tema escuro.
  - [x] Implementar `Navbar` responsiva e `Footer`.
  - [x] Critério de Aceite: Navegação fluida em telas mobile, tablet e desktop.

---

## 🎯 Fase 2: Casos de Uso Core (Obrigatórios)

### Módulo 1: Autenticação, RBAC e Carga de Testes (UC01 a UC05)
- [x] **Task 2.1: Serviços de Criptografia de Senha e Sessão JWT**
  - [x] Implementar `src/lib/auth.ts` com hash bcrypt/argon2 e geração/verificação de JWT stateless (`jose`).
  - [x] Implementar helpers para manipulação de cookies `httpOnly`, `SameSite=Lax` e `Secure`.
- [x] **Task 2.2: Login de Usuários com RBAC (UC01)**
  - [x] Implementar Route Handler `POST /api/auth/login`.
  - [x] Implementar tela `src/app/(auth)/login/page.tsx` com formulário Zod e botões de atalho com credenciais pré-preenchidas.
  - [x] Redirecionamento contextual: `ORGANIZER` -> `/organizer`, `GATEKEEPER` -> `/gatekeeper`, `CUSTOMER` -> `/` ou `returnUrl`.
- [x] **Task 2.3: Cadastro de Novos Usuários (UC02)**
  - [x] Implementar Route Handler `POST /api/auth/register` com validação de unicidade de e-mail.
  - [x] Implementar tela `src/app/(auth)/register/page.tsx` com seleção de papel (`CUSTOMER` ou `ORGANIZER`).
- [x] **Task 2.4: Middleware Edge RBAC e Proteção de Rotas (UC03)**
  - [x] Implementar `src/proxy.ts` (substituindo middleware.ts) com validação de token e proteção por papel.
  - [x] Injetar cabeçalhos downstream `x-user-id`, `x-user-role`, `x-user-email`.
  - [x] Criar página personalizada `403 Forbidden` (`src/app/forbidden.tsx`).
- [x] **Task 2.5: Script de Seed Automatizado e Idempotente (UC04)**
  - [x] Criar `prisma/seed.ts` populando 1 Organizador, 2 Clientes, 1 Portaria e 1 Evento completo com Pista e 30 Assentos VIP numerados.
  - [x] Configurar comando `npm run db:seed` no `package.json`.
- [x] **Task 2.6: Logout e Invalidação de Sessão (UC05)**
  - [x] Implementar Route Handler `POST /api/auth/logout`.
  - [x] Integrar botão de logout na `Navbar` com limpeza de estado e feedback visual.

---

### Módulo 2: Integração Externa e Gestão de Eventos (UC06 a UC10)
- [x] **Task 2.7: Integração TMDb com Catálogo Fallback Mock (UC06)**
  - [x] Implementar Route Handler `GET /api/external-catalog/tmdb`.
  - [x] Implementar catálogo mock embutido com filmes populares caso `TMDB_API_KEY` esteja ausente.
  - [x] Integrar modal de busca debounced no formulário de eventos.
- [x] **Task 2.8: Integração Ticketmaster com Catálogo Fallback Mock (UC07)**
  - [x] Implementar Route Handler `GET /api/external-catalog/ticketmaster`.
  - [x] Implementar catálogo mock embutido de shows/turnês caso `TICKETMASTER_API_KEY` esteja ausente.
  - [x] Integrar modal de busca debounced no formulário de eventos.
- [x] **Task 2.9: Criação de Evento com Setores de Pista (UC08)**
  - [x] Implementar Route Handler `POST /api/events` com validação Zod.
  - [x] Implementar formulário de criação em `src/app/(organizer)/organizer/events/create/page.tsx`.
- [x] **Task 2.9b: Classificação +18, Descrição Mínima (300 chars) e Separação Cidade/UF**
  - [x] Modelar campo `isAdult Boolean @default(false)` no `prisma/schema.prisma` e sincronizar banco.
  - [x] Atualizar `createEventSchema` com `description.min(300)` e `isAdult`.
  - [x] Atualizar `prisma/seed.ts` com descrições >= 300 caracteres e flags +18.
  - [x] Criar constante `BRAZIL_STATES` e separar campos Cidade e UF (`<Select>`) no formulário, unificando como `"Cidade, UF"`.
  - [x] Adicionar contador em tempo real (`X / 300`) na descrição do formulário de criação.
  - [x] Adicionar checkbox de classificação +18 no formulário de criação.
  - [x] Renderizar badge destacado `+18` ao lado da categoria na tela de detalhes do evento (`/events/[id]`).
  - [x] Renderizar indicador discreto `+18` no `EventCard` na vitrine (`/`) e catálogo (`/events`).
  - [x] Auditar e validar qualidade com testes automatizados e TypeScript estrito.
- [x] **Task 2.10: Criação de Evento com Mapa de Assentos Numerados (UC09)**
  - [x] Adicionar gerador de grade de assentos por fileiras e poltronas (A1..A10, B1..B10...).
  - [x] Persistir registros de `Seat` com status `AVAILABLE`.
- [x] **Task 2.11: Painel de Gestão do Organizador (UC10)**
  - [x] Implementar tela `src/app/(organizer)/organizer/page.tsx` listando eventos criados com badges de status e botão para novo evento.
- [x] **Task 2.11b: Edição de Eventos pelo Organizador (UC10)**
  - [x] Implementar schema `updateEventSchema` em `src/lib/validations/events.ts`.
  - [x] Implementar Route Handler `PUT /api/events/[id]` com verificação estrita de posse (`organizerId === userId`).
  - [x] Implementar tela `src/app/(organizer)/organizer/events/[id]/edit/page.tsx` com formulário `EditEventForm`.
  - [x] Habilitar botão "Editar" na listagem `/organizer`.
- [x] **Task 2.4b: Restrição de Acesso da Portaria (UC03)**
  - [x] Atualizar `src/proxy.ts` para redirecionar `GATEKEEPER` para `/gatekeeper` ao tentar acessar `/`, `/events`, `/events/*`, `/checkout`, `/my-tickets`.
  - [x] Atualizar `Navbar.tsx` para ocultar o link "Eventos" para a Portaria e vincular a logo a `/gatekeeper`.
- [x] **Task 1.4b: Redesign e Reposicionamento do Toast (Design System)**
  - [x] Mudar container do Toast para topo direito (`fixed top-4 right-4 z-[100]`).
  - [x] Aumentar tamanho, destaque e aplicar fundos sólidos (`success` verde, `error` vermelho, `warning` amarelo, `info` azul) com texto branco.
- [x] **Task 2.4c: Bloqueio de Auth para Usuários Logados & Modal de Restrição de Compra para Organizador**
  - [x] Redirecionar usuários logados ao tentar acessar `/login` ou `/register` para o painel de seu respectivo papel no `src/proxy.ts`.
  - [x] Bloquear chamadas de reserva (`/api/reservations/general-admission`, `/api/seats/reserve`) e checkout para `ORGANIZER` com 403.
  - [x] Criar modal informativo no frontend quando um organizador tentar comprar ingressos em `/events/[id]`, solicitando login como cliente com botão de troca de conta.
  - [x] Redirecionar `ORGANIZER` que acessar `/checkout` diretamente para `/organizer`.

---

### Módulo 3: Vitrine, Reserva Anti-Double Booking, Checkout e Ingressos (UC11 a UC20)
- [x] **Task 2.12: Vitrine Pública de Eventos e Catálogo (UC11)**
  - [x] Implementar `src/app/(customer)/page.tsx` com banner hero, destaques em 2 fileiras e carrosséis horizontais por categoria.
  - [x] Criar componente `ViewAllCard` interativo.
  - [x] Implementar a página de catálogo completo `src/app/(customer)/events/page.tsx` com busca e filtros `CategoryPills`.
  - [x] Garantir acesso 100% público sem necessidade de login para busca textual (`q`) e filtros por categoria (`CategoryPills`).
  - [x] Adicionar estados visuais de hover refinados (`hover:bg-surface-hover`, `hover:border-primary/40`, `hover:text-primary`) aos botões de filtro de categoria.
  - [x] Calcular `minPrice` dinâmico por setor.
  - [x] Implementar animação typewriter no título Hero (`TypewriterHeroTitle` / `TypewriterText`) alternando entre as 9 frases com retenção de 3s e apagamento suave.
  - [x] Adicionar suporte a termos dinâmicos com cores temáticas exclusivas para a 3ª palavra/termo-chave de cada frase no `TypewriterText`.
  - [x] Calibrar altura fixa estável no container do título Hero (`h-[...]`) para eliminar qualquer alteração de altura da página entre 1 e 2 linhas.
- [x] **Task 2.13: Visualização Detalhada do Evento (UC12)**
  - [x] Implementar `src/app/(customer)/events/[id]/page.tsx` com sinopse, informações de local/data e tabela de setores.
- [x] **Task 2.14: Reserva Atômica em Setores de Pista (UC13)**
  - [x] Implementar Route Handler `POST /api/reservations/general-admission`.
  - [x] Executar lock condicional decrementando `availableCapacity` e gerando registro `Reservation` (TTL 10m).
- [x] **Task 2.15: Mapa de Assentos Interativo & Anti-Double Booking (UC14)**
  - [x] Implementar componente interativo `SeatMap` com indicação de assentos livres, selecionados, em reserva e ocupados.
  - [x] Implementar Route Handler `POST /api/seats/reserve` com transação atômica serializada (`WHERE status = 'AVAILABLE'`).
- [x] **Task 2.16: Expiração de TTL e Liberação de Assentos (UC15)**
  - [x] Implementar rotina de *lazy expiration* nas consultas de assentos (`GET /api/events/[id]/seats`).
  - [x] Restaurar assentos expirados para `AVAILABLE` e devolver cotas de pista ao estoque.
- [x] **Task 2.17: Checkout e Pagamento Simulado Aprovado (UC16)**
  - [x] Implementar tela `src/app/(customer)/checkout/page.tsx` com cronômetro regressivo de 10 minutos sincronizado.
  - [x] Implementar Route Handler `POST /api/checkout/process` com emissão transacional de `Order`, `Ticket` e conversão para `SOLD`.
  - [x] Criar página de sucesso `src/app/(customer)/checkout/success/page.tsx`.
- [x] **Task 2.18: Simulação de Pagamento Recusado (UC17)**
  - [x] Adicionar botão explícito "Simular Pagamento Recusado" no checkout.
  - [x] Registrar pedido como `REJECTED`, liberar assentos imediatamente e exibir feedback de "Reserva Expirada ou Cancelada" com botão para retornar diretamente ao evento (`/events/[id]`).
- [x] **Task 2.19: Painel Meus Ingressos (UC18)**
  - [x] Implementar tela `src/app/(customer)/my-tickets/page.tsx` listando vouchers ativos e passados com botões de ação.
- [x] **Task 2.19b: Atualização Reativa de Ingressos ao Fechar Modal do QR Code (UC18)**
  - [x] Sincronizar dados dos ingressos e estado local ao fechar o modal do QR Code via `GET /api/my-tickets` e `router.refresh()`.
- [x] **Task 2.20: Geração e Assinatura HMAC de QR Code (UC19)**
  - [x] Implementar `src/lib/crypto.ts` com assinatura HMAC-SHA256 (`v1:{ticketCode}:{eventId}:{timestamp}:{signature}`).
  - [x] Renderizar QR Code em SVG de alta nitidez com nível de correção de erro `M`.
- [x] **Task 2.21: Compartilhamento por Link Público Tokenizado (UC20)**
  - [x] Implementar Route Handler `POST /api/tickets/[id]/share` gerando `shareToken`.
  - [x] Implementar página pública `src/app/(customer)/tickets/share/[token]/page.tsx` acessível sem autenticação e sem dados confidenciais do titular.

---

### Módulo 4: Portaria e Controle de Acesso (UC21 a UC24)
- [x] **Task 2.22: Painel Operacional da Portaria (UC21)**
  - [x] Implementar tela `src/app/(gatekeeper)/gatekeeper/page.tsx` com seletor de evento e contadores de check-in em tempo real.
- [x] **Task 2.23: Scanner Contínuo de Câmera WebRTC (UC22)**
  - [x] Implementar leitor contínuo WebRTC com mira gráfica, alternância de câmera e feedback multissensorial (áudio e vibração).
  - [x] Adicionar tratamento de permissões e contexto seguro (HTTPS / Localhost).
- [x] **Task 2.24: Validação por Digitação Manual (UC23)**
  - [x] Implementar aba de contingência com input alfanumérico e envio por Enter/botão.
- [x] **Task 2.25: Motor de Validação e os 4 Estados Claros (UC24)**
  - [x] Implementar Route Handler `POST /api/gate/validate` avaliando:
    - [x] `VALID` (Acesso Liberado - Verde)
    - [x] `ALREADY_USED` (Já Utilizado com data do 1º check-in - Laranja)
    - [x] `WRONG_EVENT` (Evento Incorreto - Vermelho)
    - [x] `INVALID_CODE` (Código Inválido ou HMAC Adulterado - Vermelho Escuro)
  - [x] Garantir anti-duplicação concorrente entre múltiplas catracas (`updateMany WHERE status = 'ACTIVE'`).
  - [x] Persistir histórico na tabela `ticket_validation_logs`.

- [x] **Task 2.26: Retenção de Compra Deslogada e Redirecionamento Direto ao Checkout (UC01, UC13, UC14)**
  - [x] Armazenar intenção de reserva no `sessionStorage` ao tentar comprar deslogado.
  - [x] Notificar o cliente e redirecionar para `/login?returnUrl=...`.
  - [x] Ao autenticar como `CUSTOMER` (via login ou cadastro), criar automaticamente a reserva e redirecionar direto para `/checkout?reservationId=...`.
  - [x] Preservar `searchParams` no middleware `src/proxy.ts`.

- [x] **Task 2.27: Atualização Reativa de Métricas da Portaria por Validação (UC21, UC24)**
  - [x] Retornar métricas consolidadas (`eventMetrics: { totalSold, totalCheckedIn }`) no endpoint `POST /api/gate/validate`.
  - [x] Atualizar estado local dos contadores (`GatekeeperMetrics`) em tempo real após cada validação.

- [x] **Task 2.28: Suporte a Eventos com Data e Horário de Início e Fim (UC08, UC09, UC10, UC11, UC12)**
  - [x] Modelar `endDate DateTime?` no `prisma/schema.prisma` e sincronizar banco.
  - [x] Atualizar schemas Zod com validação de `endDate > eventDate`.
  - [x] Implementar campos de data/hora de término nos formulários de criação e edição.
  - [x] Criar helper `formatEventDateRange` e atualizar componentes de exibição (Vitrine, Detalhes, Vouchers, Painéis).
  - [x] Atualizar `prisma/seed.ts` com horários de início e término coerentes.

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
