---
name: ui-component-builder
description: Especialista na construção de componentes e telas da Ticket Platform com foco em consistência visual, TailwindCSS 4 (@theme HSL), acessibilidade e zero duplicação de código.
---

# UI Component & Screen Builder

Esta skill orienta a criação e extensão de interfaces e componentes da **Ticket Platform Verzel**, garantindo fidelidade ao Design System e máxima reutilização de código.

## Quando usar esta Skill
- Criação ou evolução de componentes atômicos em `src/components/ui/`.
- Construção de páginas no Next.js App Router (`src/app/(auth)/`, `src/app/(customer)/`, `src/app/(organizer)/`, `src/app/(gatekeeper)/`).
- Criação de módulos e blocos visuais de negócio em `src/components/modules/`.

---

## 1. Protocolo de Construção de UI

### Passo 1: Consulta ao Catálogo Existente (Regra Anti-Duplicação)
Antes de escrever código JSX/Tailwind:
1. Verifique `src/components/ui/` para identificar componentes existentes (`Button`, `Input`, `Badge`, `Modal`, `Toast`, `Skeleton`).
2. **É PROIBIDO criar botões ou inputs inline com classes ad-hoc se puderem usar `<Button>` ou `<Input>`.**
3. Se um bloco de tela for compartilhado entre duas ou mais páginas, crie o componente em `src/components/modules/<dominio>/`.

### Passo 2: Aplicação dos Tokens Semânticos HSL (TailwindCSS 4)
Utilize as classes semânticas mapeadas no `@theme`:
- **Fundos**: `bg-main`, `bg-surface`, `bg-surface-hover`, `border-subtle`
- **Primária**: `bg-primary`, `hover:bg-primary-hover`, `text-primary-foreground`
- **Textos**: `text-text-primary`, `text-text-muted`
- **Status**: `text-success` / `bg-success/10`, `text-warning` / `bg-warning/10`, `text-danger` / `bg-danger/10`

### Passo 3: Estados Interativos Obrigatórios
Todo componente interativo deve tratar explicitamente:
- **`default`**: Estado visual de repouso com alto contraste.
- **`hover` & `active`**: Transições sutis de cor (`transition-colors duration-150`).
- **`focus-visible`**: Anel de foco nítido (`focus-visible:ring-2 focus-visible:ring-emerald-500/50`).
- **`loading`**: Spinner integrado sem alterar as dimensões do botão.
- **`disabled`**: `opacity-50 cursor-not-allowed` com bloqueio de eventos.

### Passo 4: Acessibilidade (WCAG 2.1 AA)
- Rótulos explícitos em formulários (`<label htmlFor="...">`).
- Atributos `aria-label`, `aria-expanded`, `aria-describedby` quando apropriado.
- Fechamento de modais e drawers com a tecla `Escape` e trava de scroll no `body`.
- Tamanho mínimo de alvo de toque para a portaria: 48x48px (`min-h-[48px] min-w-[48px]`).

### Passo 5: Prevenção de CLS com Skeletons
- Para telas que carregam dados assíncronos, forneça sempre um fallback com `<Skeleton>` mantendo a mesma grade e dimensões do conteúdo final.

---

## 2. Checklist de Validação Visual
- [ ] O componente consome tokens do `@theme` sem valores hexadecimais soltos?
- [ ] O componente reutiliza os blocos atômicos existentes em `src/components/ui/`?
- [ ] A tela é responsiva em telas pequenas (<640px), tablets (640-1024px) e desktops (>1024px)?
- [ ] Não há clichês visuais (*anti-AI slop*) como gradientes estridentes ou cards excessivamente aninhados?
