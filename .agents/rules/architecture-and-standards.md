---
trigger: always_on
description: Padrões de arquitetura, TypeScript 5, Next.js 16 App Router, Prisma ORM, concorrência ACID e fluxo de desenvolvimento orientado a tasks.
---

# Padrões de Arquitetura e Engenharia

Esta regra governa as decisões técnicas e o fluxo de trabalho no projeto **Ticket Platform Verzel**.

## 1. Fluxo de Trabalho, Documentação e Uso de Subagentes
- **Verificar Documentação Primeiro (Obrigatório)**: Antes de planejar ou implementar qualquer funcionalidade, consulte os arquivos em `/docs` (casos de uso em `docs/01-use-cases/`, modelos em `docs/02-architecture/DATABASE-MODELING.md`, rotas em `docs/04-api-and-integrations/`, etc.).
  - **Novo / Não descrito na doc**: Deve ser **inserido/documentado** formalmente no arquivo correspondente em `/docs` antes de codificar.
  - **Alteração de requisito**: A documentação correspondente em `/docs` deve ser **atualizada**.
  - **Conflito com a documentação**: Se a solicitação colidir ou divergir do que está documentado, o agente **DEVE pausar e questionar o usuário** sobre qual comportamento adotar antes de qualquer alteração de código.
- **Uso Compulsório de Subagentes para Codar**: Toda e qualquer implementação, modificação ou auditoria de código **SEMPRE deve ser realizada através dos subagentes especializados** (`frontend-expert`, `backend-acid-expert`, `qa-code-auditor`). O orquestrador gerencia o fluxo e delega a codificação.
- **Rastreabilidade em `tasks.md`**: Siga e mantenha as tarefas em `tasks.md`. Ao concluir uma tarefa com critérios de aceitação validados, marque o checklist `[x]`.

## 2. Padrões de Código e Tipagem
- **TypeScript Estrito**: `strict: true`, sem uso de `any`, sem `ts-ignore` indevido.
- **Path Aliases**: Utilize sempre `@/*` para imports relativos à raiz de `src/` (ex: `@/components/ui/button`, `@/lib/prisma`).
- **Validação com Zod**: Toda entrada de API (Route Handlers e Server Actions) deve ser validada por schemas Zod localizados em `src/lib/validations/`.
- **Prisma Dual-URL**: O acesso ao banco utiliza `DATABASE_URL` (pooler) no runtime da aplicação e `DIRECT_URL` nas migrações/seed.

## 3. Concorrência ACID e Anti-Double Booking
- Ao implementar reservas de assentos numerados ou ingressos de pista com capacidade limitada, utilize transações ACID atômicas (`prisma.$transaction`) com locks condicionais de tempo e status.
- Respeite o TTL de reserva de 10 minutos (`reservedUntil`).
- Garanta que requisições simultâneas para o mesmo assento resultem em exatamente 1 sucesso (`200/201`) e rejeição com status de conflito (`409 Conflict`) para as demais.

## 4. Tratamento de Erros e Respostas HTTP
- Todas as APIs devem retornar respostas padronizadas em JSON:
  - Sucesso: `{ data: ... }` ou o objeto do domínio com status 200/201.
  - Erro: `{ error: string, code?: string, details?: any }` com status apropriado (400, 401, 403, 404, 409, 500).
- No frontend, capture erros e informe o usuário através do `toast.error(message)`.
