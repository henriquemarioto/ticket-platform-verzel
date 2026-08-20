---
trigger: always_on
description: Diretrizes obrigatórias de UI, Design System, TailwindCSS 4 (@theme HEX), componentes atômicos, acessibilidade e prevenção de repetição de código.
---

# Consistência de UI, Design System e Componentização

Esta regra estabelece os padrões visuais e de componentes para todas as telas do projeto **Ticket Platform Verzel**, garantindo máxima consistência e evitando duplicação de estilos e componentes.

## 1. Tokens Semânticos HEX (TailwindCSS 4)
Toda a estilização deve consumir exclusivamente os tokens do `@theme` configurados em `src/app/globals.css`:
- **Fundos**: `bg-main` (`#faf8ff`), `bg-surface` (`#ffffff`), `bg-surface-hover` (`#f2f3ff`), bordas `border-subtle` (`#e2e8f0`).
- **Primária**: `primary` (Action Blue `#0057ff`), `primary-hover`, `primary-foreground`.
- **Textos**: `text-primary` (Deep Slate `#131b2e`), `text-muted` (Cinza `#434656`).
- **Semânticas de Status**: `success` (Válido / Aprovado), `warning` (Atenção / Já Usado), `danger` (Inválido / Recusado), `danger-dark` (Fraude / Forjado).

## 2. Reúso Obrigatório de Componentes Atômicos (`src/components/ui/`)
**NUNCA crie botões, inputs, modais ou badges inline ad-hoc com classes Tailwind repetidas.** Sempre utilize e componha a partir dos componentes base:
- `<Button>` (`src/components/ui/button.tsx`): Variantes `primary`, `secondary`, `danger`, `outline`, `ghost`; suporte nativo a `loading` (spinner) e `disabled`.
- `<Input>`, `<Select>`, `<Textarea>` (`src/components/ui/input.tsx`): Com label acessível, ícones de prefixo/sufixo e feedback de erro Zod.
- `<Badge>` (`src/components/ui/badge.tsx`): Variantes `success`, `warning`, `danger`, `neutral`.
- `<Modal>` (`src/components/ui/modal.tsx`): Diálogo modal acessível com backdrop blur, tecla Escape e bloqueio de scroll.
- `<ToastProvider>` e `useToast()` (`src/components/ui/toast.tsx`): Feedback global unificado (`success`, `error`, `warning`, `info`).
- `<Skeleton>` (`src/components/ui/skeleton.tsx`): Placeholders pulsantes durante loading para prevenir Cumulative Layout Shift (CLS).

## 3. Modularização de Telas e DRY (Don't Repeat Yourself)
- Componentes compartilhados de layout vão em `src/components/layout/` (`Navbar`, `Footer`).
- Blocos de tela e domínios específicos vão em `src/components/modules/` (`auth/`, `events/`, `tickets/`, `gatekeeper/`).
- Se um padrão visual (como um card de evento, cabeçalho de seção ou resumo de pedido) for usado em 2 ou mais lugares, extraia-o para um componente modular reutilizável.

## 4. Princípios Anti-AI Slop e Acessibilidade (WCAG 2.1 AA)
- **Sem Clichês Visuais**: Proibido gradientes de texto aleatórios, cards triplamente aninhados, contornos brilhantes neon desnecessários e ícones sem contexto.
- **Acessibilidade**: Contraste mínimo de texto 4.5:1, foco visível (`focus-visible:ring-2 focus-visible:ring-emerald-500/50`) e navegação completa por teclado.
- **Portaria (Gatekeeper)**: Alvos de toque generosos (mínimo 48x48px) e alto contraste para visualização rápida sob sol ou baixa luminosidade.
- **Responsividade Padronizada**: Layouts fluidos adaptados a Mobile (`sm`), Tablet (`md`) e Desktop (`lg`/`xl`).
