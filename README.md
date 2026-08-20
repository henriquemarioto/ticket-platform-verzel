# Ticket Platform Verzel

Bem-vindo ao repositório principal da **Plataforma de Eventos e Ingressos** (Desafio Elite Dev).

Este projeto é uma plataforma full-stack moderna construída com **Next.js 16 (App Router)**, **TypeScript**, **TailwindCSS 4** e **Prisma ORM** (PostgreSQL). A plataforma permite a criação de eventos, reserva de ingressos (Pista e Assentos Numerados) com prevenção de *double-booking*, geração de QR Codes seguros via HMAC, além de um sistema de portaria e check-in contínuo (WebRTC).

## 📖 Documentação Oficial

Toda a arquitetura, regras de negócio, wireframes, modelagem de banco de dados e requisitos técnicos estão detalhadamente documentados na pasta `docs/`.

👉 **[Acesse a Documentação Completa (Índice Mestre)](./docs/README.md)**

### Guias de Destaque
- 🚀 **[Setup & Execução Local](./docs/05-devops-and-operations/ENVIRONMENT-AND-INFRASTRUCTURE.md)**: Como rodar a aplicação e o banco de dados via Docker.
- 🏗️ **[Arquitetura e Modelagem](./docs/02-architecture/ARCHITECTURE-OVERVIEW.md)**: Desenho da solução, C4 Model e diagrama ERD.
- 🎨 **[Design System](./docs/03-design/DESIGN-SYSTEM.md)**: Padrões de UI, tokens HSL e componentes atômicos.
- 🎟️ **[Casos de Uso](./docs/01-use-cases/README.md)**: Fluxos de autenticação, vendas, reservas, portaria e mais.

---

## 🛠️ Tecnologias Principais

- **Framework**: Next.js (App Router, Server Actions, Route Handlers)
- **Linguagem**: TypeScript (`strict: true`)
- **Estilização**: TailwindCSS 4 (Utility-first, design system com variáveis nativas)
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma (Migrações e Tipagem)
- **Validação**: Zod
- **Autenticação**: RBAC com JWT e Sessões Seguras

---

## 🚀 Como Iniciar (Resumo)

Você pode executar a aplicação utilizando o **Docker Compose** para orquestrar toda a stack (banco + app).

---

1. **Configurar as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```

2. **Subir toda a stack (Aplicação Next.js + PostgreSQL)**:
   ```bash
   docker compose up -d --build
   ```
   *(ou `docker compose up -d` caso a imagem já tenha sido construída)*

> [!NOTE]
> As migrações do banco e o seed inicial de demonstração (se a base estiver vazia) são executados automaticamente durante a inicialização do container apenas em ambientes de desenvolvimento/staging. Em ambientes de produção (`APP_ENV=production` ou `NODE_ENV=production`), a execução do seed de teste é pulada automaticamente por segurança.

A aplicação estará disponível em **[http://localhost:3000](http://localhost:3000)**.

---

Para mais detalhes sobre a arquitetura e guias operacionais, consulte a [Documentação Oficial](./docs/README.md).
