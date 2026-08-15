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

Caso queira inicializar rapidamente, certifique-se de ter o Node.js e Docker instalados e siga os passos abaixo:

1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente copiando o arquivo `.env.example` (veja as chaves requeridas na documentação):
   ```bash
   cp .env.example .env
   ```
3. Inicie o banco de dados local com Docker:
   ```bash
   docker compose up -d postgres
   ```
4. Execute as migrações e o seed do banco de dados:
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador para ver o projeto rodando.

---
Para mais detalhes sobre o desafio e as entregas, consulte a [Documentação de Arquitetura e Engenharia](./docs/README.md).
