---
description: Auditoria de consistência de telas, estilização com TailwindCSS 4, tokens HSL e componentes atômicos.
---

# UI & Design System Audit Workflow (`/ui-audit`)

Utilize este workflow para inspecionar telas e componentes e garantir total consistência visual e reaproveitamento de código:

## 1. Varredura de Componentes e Estilos
1. **Inspeção de `src/components/ui/`**:
   - Verificar se todos os componentes atômicos suportam os tokens do `@theme` HSL.
   - Conferir se os estados (`loading`, `disabled`, `hover`, `focus-visible`) estão padronizados.
2. **Inspeção de `src/app/` e `src/components/modules/`**:
   - Procurar por botões ou inputs inline com classes Tailwind manuais que deveriam usar `<Button>` ou `<Input>`.
   - Procurar por cores hardcoded (hexadecimais ou classes fora da paleta do `@theme`).
   - Verificar responsividade em telas mobile, tablet e desktop.

## 2. Relatório e Ações Corretivas
- Se encontrar componentes duplicados, refatore extraindo para um módulo compartilhado.
- Garanta que mensagens de erro usem Toasts padronizados ou badges semânticas.
- Valide contraste de cores (mínimo 4.5:1) e alvos de toque na portaria (>= 48px).
