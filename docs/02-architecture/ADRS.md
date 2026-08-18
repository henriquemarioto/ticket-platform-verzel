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

# ADR 0006: Visualização de Localização via Google Maps Embed Gratuito

- **Status**: Aceito
- **Data**: 2026-08-17
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
A visualização do local físico do evento no detalhe (`/events/:id`) é crucial para a experiência do usuário. No entanto, o uso da Google Maps JavaScript API tradicional requer cadastro de cartão de crédito e chaves de API restritas (`GOOGLE_MAPS_API_KEY`), o que cria atrito na execução do projeto por avaliadores.

## 2. Decisão
Adotar a integração gratuita e universal via **Iframe Embed do Google Maps** (`https://maps.google.com/maps?q={encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`), complementada por **deep links diretos** para aplicativos de navegação móvel (Google Maps, Waze e Apple Maps).

## 3. Consequências
- **Positivas**:
  - Funciona imediatamente em qualquer ambiente (local, staging, produção) com zero custo e sem necessidade de credenciais.
  - Renderiza um mapa interativo com zoom, visualização de satélite/rua e rota direta.
  - Permite que o cliente abra a rota em seu aplicativo de navegação favorito com 1 clique.
- **Negativas / Mitigações**:
  - Personalização avançada de estilo de mapa (cores customizadas do vetor) é limitada pelo iframe padrão do Google.


---

# ADR 0007: Compartilhamento de Ingressos com Token Público e Passcode HMAC

- **Status**: Aceito
- **Data**: 2026-08-17
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
Compradores frequentemente adquirem ingressos para terceiros (amigos/família) e precisam repassar o voucher para entrada sem fornecer sua senha pessoal ou expor dados de pagamento (CPF, cartão, e-mail). Ao mesmo tempo, o link de compartilhamento precisa de uma barreira contra força-bruta.

## 2. Decisão
1. Gerar um `shareToken` aleatório único vinculado ao ingresso no banco de dados.
2. Derivar uma palavra-chave / passcode criptográfico seguro utilizando **HMAC-SHA256** do `shareToken` com o `QR_HMAC_SECRET`, truncado em 6 caracteres alfanuméricos (`?key=...`).
3. Disponibilizar a rota pública `/tickets/share/[token]?key=...` que valida a chave e renderiza o voucher oficial com QR Code limpo de dados sensíveis do titular.

## 3. Consequências
- **Positivas**:
  - Total conformidade com LGPD/privacidade: nenhum dado sensível do comprador é transmitido.
  - Proteção contra enumeração/adivinhação de tokens sem o passcode assinado.
  - Convidado acessa o QR Code oficial diretamente no smartphone sem necessidade de login.
- **Negativas / Mitigações**:
  - Se o comprador enviar o link para múltiplas pessoas, o primeiro que passar na catraca consumirá o ingresso (regra documentada em tela e no UC20).


---

# ADR 0008: Interceptação e Proteção Edge RBAC com `src/proxy.ts` no Next.js 16

- **Status**: Aceito
- **Data**: 2026-08-17
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
No Next.js 16 (App Router), o controle de acesso precisa interceptar rotas de páginas (`/organizer/*`, `/gatekeeper/*`, `/checkout/*`, `/my-tickets/*`) e rotas de API antes da execução de componentes, validando a sessão JWT e o papel (`ORGANIZER`, `GATEKEEPER`, `CUSTOMER`) em milissegundos.

## 2. Decisão
Adotar o módulo `src/proxy.ts` (convenção de proxy/interceptor de alta performance) com extração de cookies `httpOnly`, validação stateless via `jose` e injeção de cabeçalhos downstream `x-user-id`, `x-user-role` e `x-user-email`, além de redirecionamento contextual e exibição da página `403 Forbidden` (`src/app/forbidden.tsx`).

## 3. Consequências
- **Positivas**:
  - Isolamento estrito de rotas com tempo de resposta sub-milissegundo.
  - Backend/Route Handlers podem consumir `headers().get('x-user-id')` de forma confiável.
- **Negativas / Mitigações**:
  - Exige manter atualizada a lista de rotas públicas e rotas restritas por papel no proxy.


---

# ADR 0009: Design System Semântico "Kinetic Pulse" com TailwindCSS 4

- **Status**: Aceito
- **Data**: 2026-08-17
- **Decisores**: Equipe de Engenharia / Candidato Elite Dev

---

## 1. Contexto
A plataforma necessita de uma identidade visual moderna, de alto contraste e profissional, que garanta legibilidade tanto em ambientes de compra quanto sob luz solar direta no trabalho da portaria, sem apelar para clichês genéricos de IA (*anti-AI slop*).

## 2. Decisão
Adotar a paleta **Kinetic Pulse** declarada via `@theme` no TailwindCSS 4 em `src/app/globals.css`:
- **Fundo Principal (`bg-main`)**: `#faf8ff` (White Soft / Lilac Tint).
- **Superfícies (`bg-surface`)**: `#ffffff` (Pure White) com elevação e bordas sutis `#e2e8f0`.
- **Ação Primária (`primary`)**: `#0057ff` (Action Blue vibrante) e hover `#0043c8`.
- **Destaque Secundário (`secondary`)**: `#731be5` (Vibrant Purple).
- **Tipografia de Alto Contraste**: `#131b2e` (Deep Slate) e `#434656` (Muted Slate).
- **Semânticas de Status**: `#005d3f` (Sucesso/Válido), `#f59e0b` (Aviso/Usado), `#ba1a1a` (Perigo/Inválido), `#93000a` (Fraude/Forjado).

## 3. Consequências
- **Positivas**:
  - Contraste superior a 7:1 (excede WCAG 2.1 AAA para textos primários).
  - Componentes atômicos reutilizáveis (`Button`, `Input`, `Badge`, `Modal`, `Toast`, `Tooltip`, `DangerModal`, `Skeleton`) consomem tokens semânticos sem duplicação de classes.
- **Negativas / Mitigações**:
  - Exige auditoria contínua para evitar o uso de cores inline fora da paleta do `@theme`.
