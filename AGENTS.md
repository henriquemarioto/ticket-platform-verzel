# AGENTS.md - Governança de Agentes e Desenvolvimento

## 🛠️ Stack Tecnológica
- Linguagem: TypeScript 5 (`strict: true`)
- Framework Fullstack: Next.js 16 (App Router, Server Actions, Route Handlers)
- Estilização: TailwindCSS 4 (Tokens HSL no bloco `@theme`)
- Banco de Dados & ORM: PostgreSQL (Supabase Dual-Connection) + Prisma ORM

---

## 📜 Regras Gerais Obrigatórias
- Verificação e Integridade de Docs (Primeiro Passo Absoluto):
  - Sempre consultar `/docs` primeiro antes de qualquer implementação ou planejamento.
  - Não descrito na doc: Se o pedido não estiver descrito em `/docs`, deve ser inserido/documentado formalmente no arquivo correspondente antes de codificar.
  - Alteração de requisito: Se for uma modificação de regras existentes, a documentação em `/docs` deve ser atualizada.
  - Conflito com a doc: Se o pedido entrar em conflito com o que está documentado, o agente DEVE pausar e questionar o usuário sobre qual comportamento adotar antes de qualquer alteração de código.
- Uso Obrigatório de Subagentes para Codar:
  - Para escrever, alterar ou auditar código, SEMPRE utilize os subagentes especializados (`frontend-expert`, `backend-acid-expert`, `qa-code-auditor`). O agente orquestrador não deve escrever código de implementação diretamente sem delegar para os subagentes via `invoke_subagent`.
- Simplicidade & Legibilidade: Código direto, autoexplicativo, sem comentários óbvios, sem overengineering (KISS & YAGNI).
- Consistência de UI (DRY): Reutilizar sempre os componentes em `src/components/ui/` (`Button`, `Input`, `Badge`, `Modal`, `Toast`, `Skeleton`). Proibido recriar botões ou estilos ad-hoc inline.
- Concorrência ACID: Prevenção matemática contra double-booking com locks atômicos condicionais e TTL de 10 minutos (ADR 0005).
- Rastreamento de Tarefas: Executar e marcar o checklist em `tasks.md`.
- Validação de Critérios: Nenhuma tarefa é concluída sem testes e critérios de aceitação validados (`TEST-PLAN-AND-CRITERIA.md`).

---

## 🔄 Fluxo Obrigatório de Implementação
1. Verificar a Documentação (`/docs`):
   - Ler os casos de uso em `docs/01-use-cases/`, modelos em `docs/02-architecture/`, design em `docs/03-design/` e endpoints em `docs/04-api-and-integrations/`.
   - Se o pedido não constar na doc: inserir a especificação na respectiva documentação.
   - Se for uma alteração: atualizar a documentação correspondente em `/docs`.
   - Se houver conflito com a doc: perguntar ao usuário como deseja proceder antes de seguir.
2. Consultar o `tasks.md`: Selecionar ou registrar a tarefa pendente e entender seu critério de aceite.
3. Implementar SEMPRE com Subagentes Especialistas:
   - Para Telas & UI: delegar para o subagent `frontend-expert` (utilizando a skill `ui-component-builder`).
   - Para Backend, Concorrência & APIs: delegar para o subagent `backend-acid-expert` (utilizando a skill `backend-feature-builder`).
4. Auditar e Validar Qualidade:
   - Delegar para o subagent `qa-code-auditor` (utilizando a skill `code-review-and-quality`).
   - Validar critérios de aceite, compilação TypeScript e ausência de overengineering.
5. Atualizar `tasks.md` e Documentação: Marcar `[x]` na tarefa correspondente e registrar novas decisões se aplicável.

---

## 🤖 Agents, Skills e Workflows Disponíveis

### Subagents (`.agents/agents/`)
- `frontend-expert`: Especialista em UI/UX, Design System, TailwindCSS 4 e componentes atômicos, sempre consulta o documento de design.
- `backend-acid-expert`: Especialista em Route Handlers, Server Actions, Prisma e transações ACID anti-double booking.
- `qa-code-auditor`: Auditor de qualidade, simplicidade de código, conformidade de critérios e testes.

### Skills do Projeto (`.agents/skills/`)
- `ui-component-builder`: Criação de componentes atômicos e telas responsivas sem duplicação de código.
- `backend-feature-builder`: Implementação de rotas e persistência atômica com simplicidade e tipagem estrita.
- `code-review-and-quality`: Roteiro de auditoria de qualidade antes de marcar tasks como prontas.

### Workflows (`.agents/workflows/`)
- `/implement-task`: Procedimento guiado para execução de qualquer tarefa do `tasks.md`.
- `/ui-audit`: Varredura para garantir consistência visual e identificar duplicações ou estilos fora do padrão.

---

## 🚫 Restrições
- Proibido codar diretamente sem acionar subagentes especializados.
- Proibido implementar requisitos não documentados ou divergentes sem antes atualizar a doc ou consultar o usuário (em caso de conflito).
- Não adicionar bibliotecas pesadas de estado global ou camadas desnecessárias de repositórios.
- Nunca em hipótese alguma inserir o valor do env no código.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
