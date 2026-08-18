# Estrutura do Projeto e Fundação do Next.js (App Router)

Este documento estabelece as decisões de arquitetura de diretórios, convenções de código e a inicialização técnica do projeto utilizando **Next.js 16** com **TypeScript** estrito.

---

## 1. Setup do Workspace
- **Framework**: Next.js 16 (App Router com Server Components e Server Actions).
- **Linguagem**: TypeScript com `compilerOptions.strict: true` e paths aliases `@/*`.
- **Estilização**: TailwindCSS 4 com `@import "tailwindcss";` e tokens `@theme` em `globals.css`.
- **Qualidade de Código**:
  - **ESLint**: Configuração rigorosa de regras para React Hooks, Next.js e TypeScript.
  - **Prettier**: Padronização com `prettier-plugin-tailwindcss` para ordenação automática de classes.

---

## 2. Árvore de Diretórios da Aplicação (`src/`)

```text
src/
├── app/                                # Rotas e Páginas (Next.js App Router)
│   ├── (auth)/                         # Rotas de Autenticação
│   │   ├── login/page.tsx              # Tela de Login com atalhos de credenciais
│   │   └── register/page.tsx           # Tela de Cadastro com seleção de papel
│   ├── (customer)/                     # Rotas Públicas e do Comprador
│   │   ├── page.tsx                    # Vitrine Principal com Hero e Busca Rápida
│   │   ├── events/[id]/
│   │   │   ├── page.tsx                # Detalhes, Google Maps Embed & Seletor
│   │   │   └── not-found.tsx           # 404 de evento não encontrado
│   │   ├── checkout/
│   │   │   ├── page.tsx                # Checkout com Server Component
│   │   │   ├── CheckoutClient.tsx      # Lógica de Pagamento com Timer 10m
│   │   │   └── success/page.tsx        # Confirmação e Redirecionamento
│   │   ├── my-tickets/
│   │   │   ├── page.tsx                # Painel Meus Ingressos
│   │   │   └── _components/            # TicketCard e TicketTabs
│   │   └── tickets/share/[token]/
│   │       └── page.tsx                # Link Público Seguro com Passcode HMAC
│   ├── (organizer)/                    # Painel Restrito do Organizador
│   │   └── organizer/
│   │       ├── page.tsx                # Gestão de Eventos e Controle de Status
│   │       └── events/create/page.tsx  # Criação com TMDb / Ticketmaster Modal
│   ├── (gatekeeper)/                   # Painel Operacional da Portaria
│   │   └── gatekeeper/page.tsx         # Dashboard com Scanner WebRTC e Digitação
│   ├── api/                            # Route Handlers REST
│   │   ├── auth/                       # login, logout, register
│   │   ├── events/                     # Listagem e criação
│   │   │   └── [id]/
│   │   │       ├── seats/              # Mapa de assentos com lazy expiration
│   │   │       └── status/             # Atualização de status (DRAFT, CLOSED, etc)
│   │   ├── external-catalog/           # tmdb e ticketmaster com Mock Fallback
│   │   ├── gate/                       # events (ativos) e validate (4 estados)
│   │   ├── reservations/               # general-admission (pista atômica)
│   │   ├── seats/reserve/              # Bloqueio temporário atômico de poltronas
│   │   ├── checkout/process/           # Processamento transacional do pedido
│   │   ├── my-tickets/                 # Listagem de ingressos do cliente
│   │   └── tickets/[id]/share/         # Geração de shareToken público
│   ├── layout.tsx                      # Layout raiz com ToastProvider, Navbar e Footer
│   ├── globals.css                     # Tokens semânticos HEX (@theme)
│   ├── not-found.tsx                   # Página 404 global
│   ├── forbidden.tsx                   # Página 403 Forbidden
│   └── error.tsx                       # Error Boundary 500
│
├── components/                         # Biblioteca de Componentes React
│   ├── ui/                             # Componentes atômicos do Design System
│   │   ├── badge.tsx                   # Badges de status (success, warning, danger, neutral)
│   │   ├── button.tsx                  # Botões acessíveis com spinner loading
│   │   ├── danger-modal.tsx            # Modal de confirmação para ações destrutivas
│   │   ├── input.tsx                   # Inputs, Selects e Textareas com Zod feedback
│   │   ├── modal.tsx                   # Modal com backdrop blur e tecla Escape
│   │   ├── skeleton.tsx                # Skeletons pulsantes anti-CLS
│   │   ├── toast.tsx                   # Feedback flutuante unificado (useToast)
│   │   └── tooltip.tsx                 # Tooltips acessíveis com delay
│   ├── layout/                         # Componentes Estruturais
│   │   ├── Navbar.tsx                  # Barra de navegação com perfil e login
│   │   └── Footer.tsx                  # Rodapé institucional
│   └── modules/                        # Módulos de Negócio
│       ├── events/                     # SeatMap, TicketSelector, SectorItem, EventCard, etc.
│       └── gatekeeper/                 # GatekeeperDashboard, Scanner, ManualInput, Metrics, etc.
│
├── hooks/                              # Custom React Hooks
│   └── use-debounced-value.ts          # Hook para busca reativa debounced
│
├── lib/                                # Utilitários e Infraestrutura de Código
│   ├── auth.ts                         # Manipulação de Sessão JWT e Hashing
│   ├── crypto.ts                       # Assinatura HMAC-SHA256 e validação de tokens
│   ├── gatekeeper-feedback.ts          # Web Audio API e vibração háptica
│   ├── lazy-expiration.ts              # Rotinas de expiração lazy de reservas
│   ├── masks.ts                        # Máscaras de CPF, Cartão, Data e Moeda
│   ├── prisma.ts                       # Singleton do Prisma Client
│   ├── utils.ts                        # Helpers cn() e formatadores
│   ├── external/catalog-mocks.ts       # Catálogos mock embutidos TMDB/Ticketmaster
│   └── validations/                    # Schemas Zod (auth, checkout, events, gate, reservation)
│
└── proxy.ts                            # Interceptor Edge RBAC e injeção de headers
```

---

## 3. Layout Raiz e Providers Globais (`app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Verzel Tickets | Plataforma de Eventos e Ingressos",
  description: "Venda e validação de ingressos com alta segurança, concorrência ACID e portaria em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${font.variable}`}>
      <body className="min-h-screen bg-main text-primary flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <ToastProvider>
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
```
