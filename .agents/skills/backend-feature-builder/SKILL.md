---
name: backend-feature-builder
description: Especialista na implementação de Route Handlers, Server Actions, validações Zod e transações ACID no Prisma com simplicidade e prevenção de double-booking.
---

# Backend & ACID Feature Builder

Esta skill orienta a implementação de rotas de backend, validações e persistência de dados para o projeto **Ticket Platform Verzel**, focando em código simples, legível e garantias ACID.

## Quando usar esta Skill
- Criação ou evolução de Route Handlers em `src/app/api/`.
- Criação de Server Actions para mutações de dados.
- Implementação de regras de reserva, pagamento, emissão de tickets e validação na portaria.
- Modelagem de schemas Zod em `src/lib/validations/`.

---

## 1. Diretrizes de Implementação Simples

### Passo 1: Schema Zod em `src/lib/validations/`
1. Crie o schema tipado para o payload de entrada da requisição.
2. Utilize mensagens de erro claras em português.
3. Exporte tanto o schema quanto o tipo inferido (`z.infer<typeof schema>`).

### Passo 2: Route Handler ou Server Action Direto
1. Valide a requisição com `schema.safeParse(body)`. Se inválido, retorne `400 Bad Request` com o erro formatado.
2. Obtenha o contexto de autenticação/papel a partir da sessão (`src/lib/auth.ts`) ou dos headers downstream injetados pelo middleware (`x-user-id`, `x-user-role`).
3. Verifique as permissões de acesso do papel (`ORGANIZER`, `CUSTOMER`, `GATEKEEPER`).

### Passo 3: Transações ACID e Anti-Double Booking com Prisma
Para operações concorrentes de assentos ou capacidade:
1. Use `prisma.$transaction(async (tx) => { ... })`.
2. Em assentos numerados:
   - Verifique e atualize em uma única operação condicional:
     ```ts
     const updatedSeat = await tx.seat.updateMany({
       where: {
         id: seatId,
         OR: [
           { status: 'AVAILABLE' },
           { status: 'RESERVED', reservedUntil: { lt: new Date() } }
         ]
       },
       data: {
         status: 'RESERVED',
         reservedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 min TTL
         reservedById: userId
       }
     });
     if (updatedSeat.count === 0) {
       throw new Error('SEAT_ALREADY_RESERVED');
     }
     ```
3. Se a condição falhar, retorne `409 Conflict`.

### Passo 4: Respostas HTTP Padronizadas
- Sucesso com criação: `NextResponse.json({ data }, { status: 201 })`
- Sucesso com consulta/mutação: `NextResponse.json({ data }, { status: 200 })`
- Erro de validação: `NextResponse.json({ error: 'Dados inválidos', details }, { status: 400 })`
- Conflito de concorrência: `NextResponse.json({ error: 'Assento indisponível no momento' }, { status: 409 })`
- Erro interno: `NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })`

---

## 2. Checklist Anti-Overengineering
- [ ] O código utiliza Prisma diretamente sem camadas intermediárias inúteis (repositórios vazios)?
- [ ] Não há classes complexas onde funções puras e exportadas bastam?
- [ ] O tratamento de erro é limpo e sem blocos try/catch aninhados desnecessários?
- [ ] A assinatura HMAC e os tokens de ingresso seguem rigorosamente a ADR 0004?
