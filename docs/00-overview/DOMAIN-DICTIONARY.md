# Dicionário de Domínio (Ubiquitous Language)

Este documento estabelece o glossário oficial de termos e conceitos do negócio (DDD - *Domain-Driven Design*). Todos os desenvolvedores, designers e avaliadores devem utilizar esta terminologia de forma consistente em código, banco de dados, interfaces e documentações.

---

## 1. Entidades Principais e Conceitos de Negócio

### Evento (`Event`)
- **Definição**: Atividade com data, horário e local definido (show musical, exibição de filme, festival ou teatro) cadastrada por um Organizador para a qual são comercializados ingressos.
- **Estados**:
  - `DRAFT`: Evento em elaboração, invisível para o público.
  - `PUBLISHED`: Evento ativo na vitrine, aberto para reservas e compras.
  - `CLOSED`: Vendas encerradas pelo organizador ou evento iniciado; ingressos continuam válidos para validação na portaria.
  - `FINISHED`: Evento já realizado no passado.
  - `CANCELLED`: Evento cancelado pelo organizador com ingressos invalidados.

### Setor (`Sector`)
- **Definição**: Área física ou tarifária dentro do local do evento.
- **Tipos**:
  - `GENERAL_ADMISSION` (Pista): Venda por cota de ingressos livres, sem poltrona individual pré-fixada.
  - `NUMBERED_SEATS` (Assentos Numerados): Venda baseada em poltronas marcadas organizadas por fileiras e números (ex: Fileira A, Assento 12).

### Assento (`Seat`)
- **Definição**: Posição individual única dentro de um setor numerado, identificada pelo par `[Fileira, Número]`.
- **Estados**:
  - `AVAILABLE`: Livre para seleção pública.
  - `RESERVED`: Bloqueado temporariamente por um cliente em processo ativo de checkout (tempo de expiração de 10 minutos).
  - `SOLD`: Comprado e confirmado definitivamente.
  - `BLOCKED`: Indisponível administrativamente (ex: manutenção, produção).

### Ingresso / Voucher (`Ticket`)
- **Definição**: Título de acesso emitido para um cliente após a aprovação de um pedido.
- **Identificadores Únicos**:
  - `ticketCode`: Código alfanumérico curto de fácil leitura humana (ex: `ELT-7892`).
  - `secureToken`: Payload criptografado assinado com HMAC-SHA256 embutido no QR Code.
  - `shareToken`: Token público seguro para visualização de ingresso por link compartilhado.
- **Estados**:
  - `ACTIVE`: Emitido e aguardando validação na portaria.
  - `USED`: Já validado e registrado no momento da entrada.
  - `CANCELLED`: Invalidado por cancelamento ou estorno.

### Pedido (`Order`)
- **Definição**: Transação de compra agrupando um ou mais ingressos, valor total, método de pagamento e dados do cliente comprador.
- **Estados**:
  - `PENDING`: Aguardando processamento do gateway de pagamento.
  - `APPROVED`: Pagamento simulado confirmado com sucesso; gera os ingressos.
  - `REJECTED`: Pagamento recusado; libera imediatamente os assentos/ingressos de volta ao estoque.
  - `CANCELLED`: Pedido cancelado e estornado.

---

## 2. Termos de Segurança, Concorrência e Operação

### Double-Booking (Reserva Duplicada)
- **Definição**: Anomalia de concorrência onde dois clientes tentam comprar o mesmo assento físico ao mesmo tempo.
- **Prevenção**: Mecanismo de lock otimista / bloqueio temporário atômico no banco de dados (`SeatStatus.RESERVED` com `reservedUntil`).

### Portaria / Validador (`Gatekeeper`)
- **Definição**: Papel operacional responsável por controlar o fluxo de acesso na entrada do evento.
- **Modos de Validação**:
  - `WebRTC Camera Scan`: Leitura contínua por vídeo em tempo real.
  - `Manual Code Entry`: Digitação manual do `ticketCode` para contingência.

### Resultado de Validação (`ValidationResult`)
- **Definição**: Resposta emitida pelo servidor no momento em que a portaria submete um QR Code ou código manual:
  1. `VALID`: Ingresso autêntico, ativo e pertencente ao evento correto. O status é atualizado imediatamente para `USED`.
  2. `ALREADY_USED`: Ingresso legítimo que já realizou check-in previamente (exibe timestamp do primeiro acesso).
  3. `WRONG_EVENT`: Ingresso válido emitido para outro evento ou data diferente.
  4. `INVALID_CODE`: Ingresso inexistente ou QR Code com assinatura criptográfica corrompida/adulterada.

### Assinatura HMAC (Anti-Forjamento)
- **Definição**: Algoritmo de autenticação de mensagens baseado em hash (`HMAC-SHA256`) que utiliza uma chave secreta do servidor para garantir que o QR Code exibido pelo cliente não foi gerado ou alterado por terceiros.

---

## 3. Matriz Rápida de Termos em Código

| Conceito de Negócio | Termo no Código / TypeScript | Tabela / Enum Prisma |
| :--- | :--- | :--- |
| Organizador | `Role.ORGANIZER` | `User.role` |
| Cliente | `Role.CUSTOMER` | `User.role` |
| Operador de Portaria | `Role.GATEKEEPER` | `User.role` |
| Pista | `SectorType.GENERAL_ADMISSION` | `Sector.type` |
| Assentos Numerados | `SectorType.NUMBERED_SEATS` | `Sector.type` |
| Assento Temporário | `SeatStatus.RESERVED` | `Seat.status` |
| Assinatura do QR | `secureToken` | `Ticket.secureToken` |
| Link Compartilhado | `shareToken` | `Ticket.shareToken` |
| Log de Check-in | `TicketValidationLog` | `ticket_validation_logs` |
