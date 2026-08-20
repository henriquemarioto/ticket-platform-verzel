---
trigger: always_on
description: Diretrizes mandatórias de simplicidade de código, legibilidade e prevenção rigorosa de overengineering (KISS, YAGNI e Clean Code direto).
---

# Simplicidade de Código e Prevenção de Overengineering

Esta regra é de cumprimento obrigatório em todas as tarefas do projeto **Ticket Platform Verzel**.

## 1. Princípios Fundamentais (KISS & YAGNI)
- **Código Direto**: Escrever a solução mais simples e legível que resolva o problema e atenda aos critérios de aceitação.
- **Não Antecipar o Futuro**: Nunca crie abstrações, interfaces genéricas, adaptadores ou fábricas para cenários hipotéticos que não estão descritos nos documentos de requisitos (`/docs`).
- **Sem Comentários Óbvios**: O código deve ser autoexplicativo através de nomes claros de variáveis, funções e tipos. Comentários só são permitidos se houver uma razão não óbvia de negócio ou algoritmo específico.
- **Funções Pequenas e Focadas**: Funções devem ter responsabilidade única, fluxo linear e no máximo 1 ou 2 níveis de aninhamento.

## 2. Padrões de Implementação Simples

### Backend & Acesso a Dados
- Utilize o cliente **Prisma** diretamente nas rotas ou em funções utilitárias diretas (`lib/`), sem criar camadas desnecessárias de repositórios genéricos ou serviços vazios (*anemic services*).
- Validações de entrada devem ser feitas diretamente com **Zod schemas** em `src/lib/validations/`.
- Retorne respostas HTTP consistentes com helpers diretos (`NextResponse.json(...)`).

### Frontend & Componentes
- Use **Server Components** por padrão no Next.js App Router para buscar dados diretamente.
- Adicione `"use client"` apenas onde houver estado (`useState`), efeitos (`useEffect`), hooks de formulário ou manipuladores de eventos (`onClick`, `onChange`).
- Evite gerenciadores de estado global complexos (Redux, Zustand) quando o estado local do React (`useState`, `useReducer`), Context API focado ou navegação via URL (query params) resolverem o problema com simplicidade.

## 3. Checklist Anti-Overengineering
Antes de concluir qualquer arquivo de código, valide:
- [ ] Existe alguma camada de abstração que só é usada por uma única classe/função? Se sim, simplifique.
- [ ] O código possui comentários explicando o óbvio? Se sim, remova-os.
- [ ] A lógica pode ser lida e compreendida por outro desenvolvedor em menos de 2 minutos?
- [ ] Os tipos TypeScript são objetivos e diretos, sem tipagens genéricas excessivamente complexas?
