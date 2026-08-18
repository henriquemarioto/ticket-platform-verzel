# AGENTS.md - Governança de Agentes e Desenvolvimento

## 🛠️ Stack Tecnológica
- **Linguagem**: TypeScript 5 (`strict: true`)
- **Framework Fullstack**: Next.js 16 (App Router, Server Actions, Route Handlers)
- **Estilização**: TailwindCSS 4 (Tokens HSL no bloco `@theme`)
- **Banco de Dados & ORM**: PostgreSQL (Supabase Dual-Connection) + Prisma ORM

---

## 📜 Regras Gerais Obrigatórias
- **Simplicidade & Legibilidade**: Código direto, autoexplicativo, sem comentários óbvios, sem overengineering (KISS & YAGNI).
- **Consistência de UI (DRY)**: Reutilizar sempre os componentes em `src/components/ui/` (`Button`, `Input`, `Badge`, `Modal`, `Toast`, `Skeleton`). Proibido recriar botões ou estilos ad-hoc inline.
- **Concorrência ACID**: Prevenção matemática contra double-booking com locks atômicos condicionais e TTL de 10 minutos (ADR 0005).
- **Leitura Prévia**: Sempre consultar `/docs` antes de iniciar qualquer código.
- **Rastreamento de Tarefas**: Executar e marcar o checklist em `tasks.md`.
- **Validação de Critérios**: Nenhuma tarefa é concluída sem testes e critérios de aceitação validados (`TEST-PLAN-AND-CRITERIA.md`).

---

## 🔄 Fluxo Obrigatório de Implementação
1. **Verificar a Documentação**: Ler os casos de uso em `docs/01-use-cases/`, modelos em `docs/02-architecture/` e endpoints em `docs/04-api-and-integrations/`.
2. **Consultar o `tasks.md`**: Selecionar a tarefa pendente e entender seu critério de aceite.
3. **Implementar com Especialistas**:
   - Para Telas & UI: usar a skill `ui-component-builder` / subagent `frontend-expert`.
   - Para Backend & Concorrência: usar a skill `backend-feature-builder` / subagent `backend-acid-expert`.
4. **Auditar e Validar Qualidade**:
   - Executar a skill `code-review-and-quality` / subagent `qa-code-auditor`.
   - Validar critérios de aceite, compilação TypeScript e ausência de overengineering.
5. **Atualizar `tasks.md` e Documentação**: Marcar `[x]` na tarefa correspondente e registrar novas decisões se aplicável.

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
- Não inventar requisitos ou fluxos não descritos nos documentos de requisitos.
- Não adicionar bibliotecas pesadas de estado global ou camadas desnecessárias de repositórios.
- Não alterar comportamento de regras de negócio sem atualizar a respectiva documentação em `/docs`.
- Nunca em hipótese alguma inseria o valor do env do código

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
