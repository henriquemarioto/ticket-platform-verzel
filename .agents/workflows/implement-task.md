---
description: Fluxo sistemático para implementar qualquer tarefa do tasks.md mantendo simplicidade, consistência e critérios de aceite.
---

# Implement Task Workflow (`/implement-task`)

Siga este procedimento passo a passo para executar com precisão qualquer tarefa do projeto:

## 1. Verificação Prévia de Documentação (`/docs`)
1. Abra e consulte a documentação relevante em `/docs`:
   - Casos de uso: `docs/01-use-cases/`
   - Arquitetura e banco: `docs/02-architecture/`
   - Design e componentes: `docs/03-design/`
   - APIs e integrações: `docs/04-api-and-integrations/`
   - Qualidade e testes: `docs/06-quality-and-testing/`
2. **Ações sobre a Documentação**:
   - **Requisito não documentado**: Insira formalmente a especificação no arquivo correspondente em `/docs` antes de prosseguir.
   - **Alteração de requisito**: Atualize a respectiva documentação em `/docs` para refletir as novas regras.
   - **Conflito com a documentação**: Se a solicitação entrar em conflito com o que está documentado, **pause imediatamente e questione o usuário** para obter alinhamento antes de fazer qualquer alteração no código.
3. Localize ou cadastre a tarefa correspondente em `tasks.md`.

## 2. Implementação SEMPRE via Subagentes
1. O agente orquestrador **NUNCA deve codar diretamente**; deve sempre acionar os subagentes especializados via `invoke_subagent`:
   - **UI / Telas / Estilos**: subagent `frontend-expert` (utilizando a skill `ui-component-builder`).
   - **Backend / APIs / Concorrência ACID**: subagent `backend-acid-expert` (utilizando a skill `backend-feature-builder`).
2. Siga as regras de ouro:
   - **KISS/YAGNI**: Sem camadas intermediárias desnecessárias ou código especulativo.
   - **DRY**: Reutilize sempre os componentes de `src/components/ui/`.
   - **Sem Comentários Óbvios**: Código autoexplicativo e limpo.

## 3. Validação e Auditoria de Qualidade
1. Acione o subagent `qa-code-auditor` (utilizando a skill `code-review-and-quality`).
2. Verifique se o TypeScript compila sem erros (`npm run build`).
3. Valide os critérios de aceitação específicos descritos na tarefa.
4. Marque a tarefa como concluída `[x]` em `tasks.md`.
