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
│   │   ├── login/page.tsx              # Tela de Login
│   │   └── register/page.tsx           # Tela de Cadastro
│   ├── (customer)/                     # Rotas Públicas e do Comprador
│   │   ├── page.tsx                    # Vitrine Principal de Eventos
│   │   ├── events/[id]/page.tsx        # Detalhes do Evento & Mapa de Assentos
│   │   ├── checkout/page.tsx           # Fluxo de Checkout e Pagamento
│   │   ├── my-tickets/page.tsx         # Área Meus Ingressos
│   │   └── tickets/share/[token]/page.tsx # Link Público de Ingresso
│   ├── (organizer)/                    # Painel Restrito do Organizador
│   │   └── organizer/
│   │       ├── page.tsx                # Gestão de Eventos Criados
│   │       └── events/create/page.tsx  # Criação de Eventos com TMDb
│   ├── (gatekeeper)/                   # Painel Operacional da Portaria
│   │   └── gatekeeper/page.tsx         # Leitor WebRTC e Digitação Manual
│   ├── api/                            # Route Handlers REST
│   │   ├── auth/                       # Endpoints de Login, Register, Logout, Me
│   │   ├── events/                     # Listagem, Detalhes, Criação e Assentos
│   │   ├── external-catalog/           # Proxy para TMDb / Ticketmaster com Fallback Mock
│   │   ├── reservations/               # Reserva de Pista por quantidade
│   │   ├── seats/reserve/              # Bloqueio temporário atômico de assentos
│   │   ├── checkout/process/           # Processamento do Checkout e Pagamento Simulado
│   │   ├── my-tickets/                 # Listagem de ingressos do cliente
│   │   ├── tickets/                    # Emissão de links e consulta de voucher (tickets/share/[token])
│   │   ├── gate/                       # Endpoints da Portaria (events, validate, validate-manual)
│   │   └── organizer/                  # Métricas e Analytics do Organizador
│   ├── layout.tsx                      # Layout raiz com ToastProvider e Navbar
│   ├── globals.css                     # Tokens semânticos HSL
│   ├── not-found.tsx                   # Página 404 personalizada
│   └── error.tsx                       # Error Boundary 500
│
├── components/                         # Biblioteca de Componentes React
│   ├── ui/                             # Componentes atômicos do Design System
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   └── skeleton.tsx
│   ├── layout/                         # Header, Navbar, Footer
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   └── quick-role-switcher.tsx
│   └── modules/                        # Componentes específicos de negócio
│       ├── auth/login-form.tsx
│       ├── events/seat-map.tsx
│       ├── tickets/qr-code-voucher.tsx
│       └── gatekeeper/scanner.tsx
│
├── lib/                                # Utilitários e Infraestrutura de Código
│   ├── prisma.ts                       # Instância singleton do Prisma Client
│   ├── auth.ts                         # Manipulação de Sessão JWT e Hashing
│   ├── crypto.ts                       # Geração e validação HMAC de QR Code
│   └── validations/                    # Schemas Zod de Entrada e Saída
│
├── middleware.ts                       # Middleware de Proteção RBAC
└── types/                              # Tipos TypeScript compartilhados
```

---

## 3. Layout Raiz e Providers Globais (`app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Verzel Tickets | Plataforma de Eventos e Ingressos",
  description: "Venda e validação de ingressos com alta segurança e concorrência ACID.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${font.variable} dark`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
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
