# Architecture Decision Records (ADRs)

Este documento consolida todas as decisões arquiteturais fundamentais adotadas no projeto.

---

# ADR 0001: Escolha da Stack Fullstack com Next.js e TypeScript

- **Status**: Aceito
- **Data**: 2026-08-14
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
A plataforma exige renderização rápida de vitrine pública para SEO, painéis interativos com controle de assentos em tempo real e APIs seguras com validação RBAC e manipulação de criptografia.

## 2. Decisão
Adotar **Next.js 16 (App Router)** com **TypeScript** unificando frontend e backend no mesmo repositório (*monorepo monolítico modular*).

## 3. Consequências
- **Positivas**:
  - Elimina necessidade de gerenciar dois servidores e CORS separados.
  - Tipagem ponta a ponta compartilhada entre schemas de banco (Prisma), validações (Zod) e componentes React.
  - Suporte nativo a Server Actions, Server Components e Route Handlers.
- **Negativas / Mitigações**:
  - Requer atenção para não expor acidentalmente código de servidor no bundle do cliente (resolvido com organização estrita de diretórios e separação `lib/`).


---

# ADR 0002: Escolha do PostgreSQL com Prisma ORM

- **Status**: Aceito
- **Data**: 2026-08-14
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
O sistema de venda de ingressos opera sob forte concorrência (múltiplos clientes disputando os mesmos assentos no mesmo segundo). Exige garantias ACID rigorosas, integridade referencial, migrações seguras e resiliência contra esgotamento de conexões (*Connection Pool Starvation*) ao executar em ambiente **Serverless na Vercel** com banco gerenciado no **Supabase**.

## 2. Decisão
1. Utilizar o **PostgreSQL** gerenciado via **Prisma ORM**.
2. Adotar a topologia **Vercel (Serverless Next.js) + Supabase (PostgreSQL)** com **Estratégia de Dupla Conexão (Dual Connection)**:
   - **`DATABASE_URL` (Porta 6543 / Modo Transação - Supavisor)** com `?pgbouncer=true&connection_limit=1` para o runtime da aplicação Next.js, permitindo que centenas de lambdas serverless compartilhem conexões sem estourar o limite `max_connections` do PostgreSQL.
   - **`DIRECT_URL` (Porta 5432 / Conexão Direta)** para comandos administrativos da CLI do Prisma (`prisma migrate deploy`, `prisma migrate dev`, `prisma db seed`), garantindo suporte a *advisory locks* e operações DDL.
3. Utilizar o padrão **Singleton** no `src/lib/prisma.ts` ancorado no `globalThis` para otimizar conexões durante *warm starts* das funções serverless da Vercel e durante o HMR local.

## 3. Consequências
- **Positivas**:
  - **Prevenção de Esgotamento de Pool**: O Supavisor multiplexa as conexões das lambdas da Vercel, impedindo que picos de vendas derrubem o banco com erro `Too many connections`.
  - **Migrações Confiáveis**: O uso de `DIRECT_URL` garante que os comandos de DDL do Prisma consigam adquirir locks consultivos (`pg_advisory_lock`) sem conflitar com o pooler em modo transação.
  - **Garantias ACID e Tipagem Estrita**: Suporte total a transações isoladas para prevenir *double-booking* e tipagem automática sincronizada no TypeScript.
- **Negativas / Mitigações**:
  - Exige configuração explícita de duas variáveis de ambiente (`DATABASE_URL` e `DIRECT_URL`) tanto localmente quanto na Vercel.
  - No runtime com pooler em modo transação, *prepared statements* de nível de sessão são desativados via `?pgbouncer=true`, o que é tratado de forma nativa e transparente pelo Prisma Client.



---

# ADR 0003: Estratégia de Autenticação JWT Stateless com Cookies HttpOnly

- **Status**: Aceito
- **Data**: 2026-08-14
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
A plataforma precisa autenticar usuários com 3 papéis (`ORGANIZER`, `CUSTOMER`, `GATEKEEPER`) com proteção contra roubo de credenciais (XSS/CSRF) e validação rápida em nível de Middleware.

## 2. Decisão
Adotar **JWT Stateless** assinado via HS256 (`jose`), persistido em cookie com as flags `httpOnly: true`, `SameSite: "lax"` e `secure` em produção.

## 3. Consequências
- **Positivas**:
  - Impossibilidade de roubo de token via scripts maliciosos client-side (`document.cookie` / `localStorage`).
  - Verificação ultra-rápida no Middleware do Next.js sem necessidade de consulta ao banco a cada requisição de página estática.
- **Negativas / Mitigações**:
  - Invalidação instantânea de sessão requer rotação de chave ou lista de revogação caso necessário.


---

# ADR 0004: Assinatura Criptográfica de QR Code com HMAC-SHA256

- **Status**: Aceito
- **Data**: 2026-08-14
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
Os ingressos impressos ou exibidos em smartphones podem ser alvos de tentativas de falsificação (ex: geração de QR Code com ID inventado ou adulteração de imagem). A portaria precisa de garantia matemática de autenticidade.

## 2. Decisão
Adotar **HMAC-SHA256** utilizando o módulo nativo `node:crypto` para assinar o payload do QR Code com uma chave secreta (`QR_HMAC_SECRET`).

Payload estruturado:
```text
v1:{ticketCode}:{eventId}:{timestamp}:{hmacSignature}
```

## 3. Consequências
- **Positivas**:
  - Impossibilidade prática de falsificação sem posse da chave secreta.
  - Leitura rápida e validação local na API sem dependências externas pesadas.
- **Negativas / Mitigações**:
  - Exige salvaguarda segura da variável de ambiente `QR_HMAC_SECRET`.


---

# ADR 0005: Estratégia de Prevenção de Double-Booking e Controle de Concorrência

- **Status**: Aceito
- **Data**: 2026-08-14
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
Durante o lançamento de eventos populares, dezenas de clientes tentam selecionar a mesma poltrona numerada ou os últimos ingressos de pista na mesma fração de segundo. É inaceitável permitir que dois clientes concluam a compra do mesmo lugar.

## 2. Decisão
Adotar um mecanismo de **Reserva Temporária Atômica com Lock Condicional** no banco de dados:
1. Ao selecionar o assento, o status é alterado para `RESERVED` com `reservedUntil = NOW() + 10 minutos` e `reservedById = userId`.
2. A query de bloqueio utiliza condição atômica (`WHERE id = :id AND (status = 'AVAILABLE' OR (status = 'RESERVED' AND reservedUntil < NOW()))`).
3. Ao finalizar o checkout com pagamento aprovado, o assento é transacionado para `SOLD`.
4. Se o pagamento for recusado ou o tempo expirar, o assento é liberado.

## 3. Consequências
- **Positivas**:
  - Garantia matemática contra double-booking sem necessidade de travas distribuídas complexas (ex: Redis Redlock) para o escopo do projeto.
  - Feedback em tempo real para o segundo usuário de que o lugar acabou de ser selecionado.
- **Negativas / Mitigações**:
  - Requer que o sistema trate assentos expirados ao listar disponibilidade.


---

