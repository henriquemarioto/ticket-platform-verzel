---
name: code-review-and-quality
description: Auditor de qualidade, simplicidade de código (KISS/YAGNI), conformidade com o Design System, validação de critérios de aceite e atualização de tasks.md.
---

# Code Review & Quality Assurance

Esta skill orienta a auditoria e validação de qualidade de qualquer código desenvolvido na **Ticket Platform Verzel** antes da conclusão da tarefa.

## Quando usar esta Skill
- Ao finalizar uma tarefa de `tasks.md`.
- Antes de commitar ou marcar itens de checklist como concluídos.
- Durante inspeções de integridade de código, UX e segurança.

---

## 1. Roteiro de Auditoria por Pilares

### Pilar 1: Simplicidade e Anti-Overengineering (KISS / YAGNI)
- [ ] O código resolve exatamente o que foi pedido nos critérios de aceite sem complexidade extra?
- [ ] Foram eliminados comentários óbvios e redundantes?
- [ ] Não existem abstrações precoces, interfaces não utilizadas ou wrappers anêmicos?
- [ ] O fluxo lógico é linear e compreensível?

### Pilar 2: Consistência de UI e Design System
- [ ] Os componentes atômicos em `src/components/ui/` foram reutilizados?
- [ ] Foram evitadas duplicações de classes Tailwind ou recriação de botões/inputs?
- [ ] Os tokens semânticos do `@theme` HSL foram respeitados?
- [ ] Os estados de `loading`, `disabled`, `hover` e foco por teclado estão funcionando?
- [ ] A responsividade está testada para telas mobile, tablet e desktop?

### Pilar 3: Segurança e Concorrência ACID
- [ ] Rotas sensíveis possuem autenticação e autorização RBAC adequadas?
- [ ] Operações críticas (reserva de assento, compra, validação de ingresso) estão envelopadas em transações atômicas com locks condicionais?
- [ ] O QR Code e tokens utilizam assinatura HMAC-SHA256 íntegra?

### Pilar 4: Tipagem TypeScript e Testes
- [ ] O projeto compila com `npm run build` sem erros de TypeScript (`strict: true`) ou ESLint?
- [ ] Os testes unitários ou de integração cobrem os fluxos principais e cenários de exceção?
- [ ] Nenhum `any` implícito ou explícito foi introduzido?

---

## 2. Conclusão da Tarefa
Somente após validar todos os pilares acima:
1. Marque o item correspondente em `tasks.md` com `[x]`.
2. Se houver novas decisões ou ajustes de comportamento, atualize a documentação em `/docs`.
