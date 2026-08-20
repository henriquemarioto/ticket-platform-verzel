# Ambiente, Infraestrutura e Pipeline CI/CD

Este documento consolida a configuração do ambiente local de desenvolvimento, containerização Docker, topologia em nuvem (Vercel + Supabase com Connection Pooler Supavisor) e automação de CI/CD.

---

# Guia de Configuração do Ambiente de Desenvolvimento

Este documento descreve os passos necessários para configurar e executar o projeto localmente do zero.

---

## 1. Pré-requisitos

- **Node.js**: Versão 20.x ou superior (LTS recomendada).
- **Docker & Docker Compose**: Para execução do PostgreSQL local.
- **npm** ou **pnpm**.

---

## 2. Passo a Passo de Execução

### Passo 1: Clonar o Repositório e Instalar Dependências

```bash
git clone https://github.com/henriquemarioto/ticket-platform-verzel.git
cd ticket-platform-verzel
npm install
```

### Passo 2: Configurar as Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

#### Estrutura das Variáveis de Conexão com o Banco de Dados e Ambiente:

- **`APP_ENV`**: Define o ambiente da aplicação (`development` | `staging` | `production`). O seed automático e a execução de dados de teste são executados apenas em ambientes diferentes de `production` (`APP_ENV != 'production'` e `NODE_ENV != 'production'`).
- **`DATABASE_URL`**: Conexão utilizada pelo runtime da aplicação (`PrismaClient`). Em produção (Supabase), conecta através do pooler **Supavisor na porta 6543** com os parâmetros `?pgbouncer=true&connection_limit=1` para evitar esgotamento de conexões na Vercel.
- **`DIRECT_URL`**: Conexão direta utilizada pela CLI do Prisma (`prisma migrate`, `prisma db push`, `prisma db seed`) na **porta 5432**, permitindo _advisory locks_ e comandos de manipulação DDL.
- **`AUTH_SECRET`**: Chave secreta de alta entropia para assinatura e validação dos tokens JWT (Stateless).
- **`QR_HMAC_SECRET`**: Chave secreta exclusiva para geração de assinaturas HMAC-SHA256 dos ingressos e QR Codes anti-fraude.

#### Exemplo 1: Ambiente Local (Docker PostgreSQL)

```env
APP_ENV="development"
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ticket_platform?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/ticket_platform?schema=public"
AUTH_SECRET="dev-super-secret-jwt-key-minimum-32-chars-long"
QR_HMAC_SECRET="dev-super-secret-hmac-key-minimum-32-chars-long"
TMDB_API_KEY=""
TICKETMASTER_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Exemplo 2: Ambiente de Produção (Vercel + Supabase)

```env
APP_ENV="production"
# Pooler Supavisor (Porta 6543) para Serverless Runtime
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Conexão Direta (Porta 5432) para Migrações de Schema
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
AUTH_SECRET="prod-ultra-secure-jwt-key-generated-with-openssl"
QR_HMAC_SECRET="prod-ultra-secure-hmac-key-generated-with-openssl"
TMDB_API_KEY="sua-chave-tmdb-de-producao"
TICKETMASTER_API_KEY="sua-chave-ticketmaster-de-producao"
NEXT_PUBLIC_APP_URL="https://seu-dominio.vercel.app"
```

### Passo 3: Iniciar o Banco de Dados com Docker Compose

```bash
docker compose up -d postgres
```

### Passo 4: Executar as Migrações do Prisma e Carga de Teste (Seed)

```bash
npm run db:migrate:dev
npm run db:seed
```

### Passo 5: Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 3. Credenciais Pré-configuradas para Testes

| Perfil          | E-mail                      | Senha Padrão | Finalidade                    |
| :-------------- | :-------------------------- | :----------- | :---------------------------- |
| **Organizador** | `organizador@verzel.com.br` | `Senha123!`  | Publicar e gerenciar eventos  |
| **Cliente 1**   | `cliente1@verzel.com.br`    | `Senha123!`  | Comprar e testar concorrência |
| **Cliente 2**   | `cliente2@verzel.com.br`    | `Senha123!`  | Testar conflito de assentos   |
| **Portaria**    | `portaria@verzel.com.br`    | `Senha123!`  | Validar ingressos na entrada  |

---

## 4. Atalhos e Scripts do Prisma (`npm run db:*`)

Os seguintes comandos rápidos estão configurados no `package.json` para facilitar o gerenciamento do banco de dados e tipos:

| Comando                     | Equivalente CLI                | Finalidade                                                                          |
| :-------------------------- | :----------------------------- | :---------------------------------------------------------------------------------- |
| `npm run db:generate`       | `prisma generate`              | Gera/atualiza o Prisma Client tipado em `node_modules`.                             |
| `npm run db:push`           | `prisma db push`               | Sincroniza o schema diretamente com o banco sem gerar arquivos de migração.         |
| `npm run db:migrate:dev`    | `prisma migrate dev`           | Cria e aplica novas migrações em ambiente de desenvolvimento.                       |
| `npm run db:migrate:deploy` | `prisma migrate deploy`        | Aplica migrações pendentes em staging/produção de forma segura.                     |
| `npm run db:migrate:reset`  | `prisma migrate reset`         | Reseta o banco em ambiente dev (solicita confirmação).                              |
| `npm run db:reset`          | `prisma migrate reset --force` | Reseta e recria o banco forçadamente sem confirmação interativa.                    |
| `npm run db:status`         | `prisma migrate status`        | Exibe o status e histórico das migrações aplicadas.                                 |
| `npm run db:studio`         | `prisma studio`                | Abre a interface gráfica interativa do Prisma Studio na porta 5555.                 |
| `npm run db:seed`           | `prisma db seed`               | Executa o script de carga inicial de dados (`prisma/seed.ts` - ignora em produção). |
| `postinstall`               | `prisma generate`              | Garante a compilação dos tipos do Prisma Client automaticamente após `npm install`. |

---

# Docker e Infraestrutura de Desenvolvimento

Este documento descreve a orquestração de containers com **Docker Compose** e o empacotamento com **Dockerfile multi-stage**.

---

## 1. Orquestração Local (`docker-compose.yml`)

Permite subir a infraestrutura completa de banco de dados PostgreSQL com um único comando:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ticket-platform-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-ticket_platform}
    ports:
      - '5433:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Comandos Rápidos:

- Iniciar banco de dados: `docker compose up -d postgres`
- Verificar status: `docker compose ps`
- Parar containers: `docker compose down`

---

## 2. Dockerfile Multi-Stage de Produção (`Dockerfile`)

```dockerfile
# Stage 1: Instalação de dependências
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build da aplicação Next.js
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_STANDALONE=true
RUN npx prisma generate
RUN npm run build

# Stage 3: Execução enxuta (Production Runner)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2.1 Ativação Condicional do Modo Standalone (`BUILD_STANDALONE`)

- **Vercel (Serverless)**: Não utiliza o modo standalone (`output: undefined`). O empacotador da Vercel (NFT - Node File Trace) gerencia automaticamente as dependências e o bundling das Serverless Functions. O uso de `output: "standalone"` na Vercel causa o erro de arquivo ausente `.next/next-server.js.nft.json`.
- **Docker / Containers**: Define `ENV BUILD_STANDALONE=true` no stage `builder` do Dockerfile para que o Next.js gere o diretório `.next/standalone`, produzindo imagens enxutas contendo apenas as dependências e arquivos mínimos para execução com Node.js (`server.js`).

---

## 3. Infraestrutura em Nuvem: Vercel + Supabase

Para o ambiente de produção e homologação na nuvem, a infraestrutura adota arquitetura desacoplada:

| Camada                         | Provedor           | Função                                                                | Detalhes de Conexão                                                                                                                  |
| :----------------------------- | :----------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Front-End & API Serverless** | **Vercel**         | Execução de Next.js App Router (SSR, Route Handlers, Server Actions). | Conecta ao Supabase usando `DATABASE_URL` via Supavisor Pooler (Porta `6543`) com `?pgbouncer=true&connection_limit=1`.              |
| **Banco de Dados Relacional**  | **Supabase (AWS)** | PostgreSQL 16 com extensões nativas e pooler Supavisor integrado.     | Expõe a porta `6543` (Transaction Pooler) para runtime e a porta `5432` (`DIRECT_URL`) para migrações DDL e scripts administrativos. |

### Benefícios da Estrutura Serverless + Supavisor:

1. **Zero Downtime em Picos de Tráfego**: A multiplexação de conexões pelo Supavisor previne o erro `Too many connections` quando múltiplas lambdas da Vercel atendem usuários simultâneos no checkout.
2. **Isolamento de Migrações**: Operações de schema (`prisma migrate deploy`) ocorrem diretamente na porta `5432` sem sofrer restrições de locks transacionais do PgBouncer.

---

# Pipeline de CI/CD e Automação

Este documento descreve as etapas de integração contínua (CI) e entrega contínua (CD).

---

## 1. Fluxo de CI (GitHub Actions)

A cada _Pull Request_ ou _Push_ na branch `main`, a pipeline automatizada executa:

1. **Linting & Code Quality**: `npm run lint` (ESLint) e `npm run format:check` (Prettier).
2. **Type Checking**: `npx tsc --noEmit` para garantir tipagem TypeScript estrita sem suppressão não autorizada.
3. **Geração do Prisma Client**: `npx prisma generate` para compilar os tipos relacionais.
4. **Testes Unitários & Integração**: `npm run test` (Jest / Vitest) com cobertura dos fluxos de concorrência e HMAC.
5. **Build de Produção**: `npm run build` para validar o empacotamento do Next.js.

---

## 2. Estratégia de Deploy Contínuo (Vercel + Supabase)

A topologia de produção adota a separação estrita entre a camada de **migrações DDL** e a camada de **execução serverless**:

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Git Push (main)
    participant CI as GitHub Actions / Vercel Build
    participant DirectDB as Supabase Direct (Porta 5432)
    participant Vercel as Vercel Edge / Serverless
    participant Pooler as Supavisor Pooler (Porta 6543)

    Dev->>CI: Dispara novo release
    Note over CI: Passo 1: Execução de Migrações
    CI->>DirectDB: Executa 'prisma migrate deploy' usando DIRECT_URL
    DirectDB-->>CI: Schema atualizado com advisory locks adquiridos

    Note over CI: Passo 2: Compilação dos Bundles
    CI->>CI: Executa 'prisma generate && next build'

    Note over CI,Vercel: Passo 3: Ativação do Novo Deployment
    CI->>Vercel: Publica funções Serverless na Vercel
    Vercel->>Pooler: Runtime consome DATABASE_URL (?pgbouncer=true&connection_limit=1)
    Pooler-->>Vercel: Queries multiplexadas sem risco de Connection Exhaustion
```

### 2.1 Passos de Configuração na Vercel

1. **Build Command**:
   ```bash
   prisma generate && next build
   ```
2. **Variáveis de Ambiente (Environment Variables)**:
   - `APP_ENV`: `production` (impede execução de seed de teste no ambiente de produção)
   - `DATABASE_URL`: `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL`: `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
   - `AUTH_SECRET`: Segredo JWT seguro.
   - `QR_HMAC_SECRET`: Segredo HMAC anti-fraude.
   - `TMDB_API_KEY`: Chave de API do TMDb (opcional).
   - `TICKETMASTER_API_KEY`: Chave de API do Ticketmaster (opcional).
   - `NEXT_PUBLIC_APP_URL`: URL do deploy de produção na Vercel.

### 2.2 Execução de Migrações em Produção

As migrações de schema nunca devem ser executadas dentro do runtime de uma requisição web. Devem ocorrer durante a etapa de release/deploy:

```bash
# Executa migrações pendentes de forma segura usando a DIRECT_URL
npm run db:migrate:deploy
```

---
