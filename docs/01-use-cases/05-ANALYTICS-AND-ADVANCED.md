# Módulo 5: Analytics, Cancelamento, Infraestrutura e Qualidade (UC25 a UC30)

Este documento consolida os casos de uso detalhados do módulo.

> [!NOTE]
> **Status do Módulo**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)

---

# Caso de Uso: UC25 - Busca e Filtros Multicritério de Eventos

## Plataforma de Eventos e Ingressos (Fase 3 - Diferenciais)

---

## 1. Identificação e Descrição

- **Identificador**: `UC25`
- **Classificação**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)
- **Nome**: Busca e Filtros Multicritério (Categoria, Faixa de Preço, Data, Cidade e Ordenação)
- **Objetivo**: Permitir que os clientes localizem eventos com precisão através de um painel de filtros combináveis (múltiplas categorias, range de preço min/max, seletor de datas e períodos, dropdown de cidades atendidas e ordenação dinâmica por menor preço, maior preço ou data mais próxima).

---

## 2. Atores

- **Cliente / Visitante**: Aplica critérios combinados para encontrar eventos específicos.
- **Engine de Busca (Backend / PostgreSQL)**: Executa queries indexadas com múltiplos filtros combinados em `WHERE` clauses.

---

## 3. Pré-condições e Pós-condições

- **Pré-condição**:
  - O usuário acessa a área de busca ou aplica filtros na vitrine.
- **Pós-condição**:
  - A URL do navegador é sincronizada com os parâmetros de busca (`/events?category=SHOW&city=SP&minPrice=50...`).
  - A listagem de eventos é atualizada instantaneamente sem recarregar a página.

---

## 4. Diagrama de Sequência

```mermaid
sequenceDiagram
    autonumber
    actor User as Cliente / Visitante
    participant UI as Painel de Filtros (/events)
    participant API as API de Busca (/api/events/search)
    participant DB as PostgreSQL (Prisma)

    User->>UI: Seleciona Categoria="SHOW", Cidade="São Paulo", PreçoMax=200, Ordenação="price_asc"
    UI->>UI: Atualiza query params na URL (/events?cat=SHOW&city=São+Paulo&maxPrice=200&sort=price_asc)
    UI->>API: GET /api/events/search?category=SHOW&city=São+Paulo&maxPrice=200&sort=price_asc
    API->>DB: Executa query com filtros combinados e cálculo de minPrice nos setores
    DB-->>API: Retorna eventos correspondentes paginados
    API-->>UI: 200 OK { total: 3, events: [...] }
    UI->>User: Renderiza grade de cards atualizada e contador: "3 eventos encontrados"
```

---

## 5. Fluxo Principal de Execução

1. O usuário clica no botão "Filtros" na vitrine de eventos.
2. Um painel expansível / gaveta lateral se abre contendo:
   - **Categorias (Multi-select)**: `Shows`, `Filmes`, `Teatro`, `Festivais`.
   - **Faixa de Preço (Dual Slider / Inputs)**: Preço mínimo (R$) e Preço máximo (R$).
   - **Período de Realização**:
     - Atalhos rápidos: _"Hoje"_, _"Este Fim de Semana"_, _"Este Mês"_.
     - Seletor de intervalo de datas customizado (`Data Início` até `Data Fim`).
   - **Cidade**: Dropdown com cidades que possuem eventos ativos cadastrados.
   - **Ordenação**:
     - _Data mais próxima_ (padrão)
     - _Menor preço_
     - _Maior preço_
     - _Nome (A-Z)_
3. O usuário seleciona os filtros desejados.
4. O front-end sincroniza o estado nos _searchParams_ do Next.js e dispara a requisição com debounce de 300ms.
5. O backend executa a query relacional no banco de dados e retorna os resultados.
6. A página exibe a grade filtrada com chips/tags removíveis para cada filtro ativo (ex: `[Shows x]`, `[Até R$ 200 x]`, `[São Paulo x]`).
7. O usuário pode clicar em "Limpar Todos os Filtros" para restaurar a listagem padrão.

---

## 6. Fluxos Alternativos e Exceções

### Fluxo Alternativo 1: Compartilhamento de Link de Busca Filtrada

- **Cenário**: O usuário copia a URL com os filtros aplicados e envia para um amigo.
- **Comportamento**: Ao abrir a URL, o front-end reidrata os filtros a partir dos parâmetros de busca e renderiza exatamente a mesma seleção de eventos.

---

## 7. Regras de Negócio (RN)

- **RN01 - Consistência de Faixa de Preço**: O `minPrice` não pode ser maior que o `maxPrice`.
- **RN02 - Paginação Eficiente**: Listagens com grande volume de resultados devem suportar paginação com `limit` padrão de 12 itens por página.

---

## 8. Contratos de API

### Requisição: `GET /api/events/search?category=SHOW&city=São%20Paulo&minPrice=50&maxPrice=250&sortBy=price&sortOrder=asc&page=1`

### Resposta de Sucesso: `HTTP 200 OK`

```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 3,
    "totalPages": 1
  },
  "events": [
    {
      "id": "evt_rock2026",
      "title": "Festival Indie Rock Verzel 2026",
      "category": "SHOW",
      "eventDate": "2026-11-20T20:00:00.000Z",
      "locationName": "Espaço Hall Cultural",
      "city": "São Paulo, SP",
      "minPrice": 120.0,
      "bannerUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745"
    }
  ]
}
```

---

## 9. Critérios de Aceite (BDD / Gherkin)

```gherkin
Funcionalidade: Busca e Filtros de Eventos
  Como um Cliente
  Eu quero filtrar eventos por múltiplos critérios combinados
  Para encontrar rapidamente opções dentro do meu orçamento e cidade

  Cenário: Aplicação de filtros combinados de categoria e preço
    Dado que existem múltiplos eventos cadastrados
    Quando eu seleciono a categoria "Shows", a cidade "São Paulo" e o preço máximo "R$ 200,00"
    Então a listagem deve exibir apenas os eventos que atendam simultaneamente a todos os critérios
    E os chips dos filtros ativos devem ser exibidos no topo da grade
```

---

# Caso de Uso: UC26 - Painel Analítico e Métricas do Organizador

## Plataforma de Eventos e Ingressos (Fase 3 - Diferenciais)

---

## 1. Identificação e Descrição

- **Identificador**: `UC26`
- **Classificação**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)
- **Nome**: Dashboard Analítico de Vendas, Faturamento e Monitoramento de Check-in
- **Objetivo**: Prover ao Organizador uma visão gerencial gráfica e consolidada da performance de seus eventos, detalhando faturamento bruto acumulado, taxa de conversão, percentual de ocupação por setor (pista vs. assentos numerados) e comparecimento da portaria através de consulta e sincronização sob demanda via botão "Atualizar".

---

## 2. Atores

- **Organizador (`ORGANIZER`)**: Consulta métricas financeiras e operacionais para tomada de decisão.
- **Engine de Métricas (Backend / Aggregations)**: Realiza cálculos agregados no banco de dados (`SUM`, `COUNT`, `GROUP BY`).

---

## 3. Pré-condições e Pós-condições

- **Pré-condição**:
  - O usuário autenticado possui o papel `ORGANIZER`.
- **Pós-condição**:
  - O painel renderiza gráficos interativos, KPIs numéricos e tabela detalhada de vendas por setor.

---

## 4. Diagrama de Sequência

```mermaid
sequenceDiagram
    autonumber
    actor Org as Organizador
    participant UI as Dashboard (/organizer/analytics)
    participant API as API de Analytics (/api/organizer/analytics)
    participant DB as PostgreSQL (Prisma)

    Org->>UI: Acessa /organizer/analytics ou clica em "Ver Analytics" de um evento
    UI->>API: GET /api/organizer/analytics?eventId=evt_rock2026
    API->>DB: Agrega Orders aprovados (SUM totalAmount), ingressos por setor e check-ins na portaria
    DB-->>API: Retorna KPIs e dados de séries temporais
    API-->>UI: 200 OK { metrics: {...}, sectorsDistribution: [...], checkInRate: {...} }
    UI->>Org: Renderiza gráficos de barras/pizza, cards de receita e taxa de comparecimento
```

---

## 5. Fluxo Principal de Execução

1. O organizador acessa o painel de métricas em `/organizer/analytics` (tela padrão no login do perfil Organizador).
2. A tela exibe um seletor de evento (com opção de "Todos os Eventos" ou evento específico).
3. O painel renderiza os **KPIs Principais (Cards de Topo)**:
   - 💰 **Receita Bruta Total**: Ex: `R$ 38.200,00` (soma de todos os pedidos aprovados).
   - 🎟️ **Total de Ingressos Vendidos**: Ex: `215 / 230` (taxa de ocupação global de `93.4%`).
   - 🚪 **Presença na Portaria**: Ex: `180` check-ins efetuados (`83.7%` de comparecimento dos compradores).
   - 👥 **Ticket Médio**: Ex: `R$ 177,67` por ingresso vendido.
4. **Gráficos Visuais com Recharts**:
   - **Evolução de Vendas no Tempo (`AreaChart`)**: Curva suave com gradiente demonstrando receita e ingressos por dia.
   - **Ocupação e Vendas por Setor (`BarChart`)**: Gráfico de barras comparando capacidade total vs ingressos vendidos por setor (exibido e buscado no banco exclusivamente ao selecionar um evento específico; ordenado por receita decrescente).
   - **Distribuição de Comparecimento (`PieChart` / Donut)**: Fatias detalhando Presentes (check-in realizado), Aguardando Check-in e Vagas Disponíveis.
   - **Tabela Detalhada de Setores**: Listagem dos setores do evento específico ordenada por receita em ordem decrescente.
5. O organizador pode exportar o relatório real baixando arquivo em formato CSV.

---

## 6. Fluxos Alternativos e Exceções

### Fluxo Alternativo 1: Evento Sem Vendas Ainda

- **Cenário**: O evento foi recém-publicado e não possui compras registradas.
- **Comportamento**: Os gráficos exibem estado zero amigável com mensagem: _"Aguardando as primeiras vendas deste evento."_.

---

## 7. Regras de Negócio (RN)

- **RN01 - Isolamento Estrito de Faturamento**: O organizador só pode visualizar métricas e faturamento dos eventos que ele próprio criou (`event.organizerId === user.id`).
- **RN02 - Exclusão de Pedidos Cancelados e Recusados**: Pedidos com status `REJECTED` ou ingressos com status `CANCELLED` são devidamente debitados do faturamento líquido exibido.
- **RN03 - Tela Padrão de Entrada**: A rota `/organizer/analytics` é a tela inicial padrão pós-autenticação para usuários com papel `ORGANIZER`.
- **RN04 - Escopo de Vendas por Setor e Ordenação**: A agregação e listagem de vendas por setor é restrita à visualização de eventos individuais (quando `eventId !== 'all'`), devendo ser ordenada pela receita em ordem decrescente.

---

## 8. Contratos de API

### Requisição: `GET /api/organizer/analytics?eventId=evt_rock2026`

### Resposta de Sucesso: `HTTP 200 OK`

```json
{
  "success": true,
  "events": [
    {
      "id": "evt_rock2026",
      "title": "Festival Indie Rock Verzel 2026"
    }
  ],
  "summary": {
    "totalRevenue": 38200.0,
    "totalTicketsSold": 215,
    "totalCapacity": 230,
    "occupancyRate": 93.48,
    "checkedInCount": 180,
    "checkInRate": 83.72,
    "averageTicketPrice": 177.67
  },
  "sectors": [
    {
      "sectorName": "Pista Geral",
      "sold": 185,
      "capacity": 200,
      "available": 15,
      "revenue": 22200.0,
      "occupancyRate": 92.5
    },
    {
      "sectorName": "Plateia VIP Numerada",
      "sold": 30,
      "capacity": 30,
      "available": 0,
      "revenue": 16000.0,
      "occupancyRate": 100.0
    }
  ],
  "salesTimeline": [
    {
      "date": "2026-08-14",
      "formattedDate": "14/08",
      "amount": 22200.0,
      "tickets": 185
    }
  ],
  "attendanceDistribution": [
    { "name": "Presentes (Check-in)", "value": 180, "color": "#005d3f" },
    { "name": "Aguardando Entrada", "value": 35, "color": "#0057ff" },
    { "name": "Vagas Disponíveis", "value": 15, "color": "#e2e8f0" }
  ]
}
```

---

## 9. Critérios de Aceite (BDD / Gherkin)

```gherkin
Funcionalidade: Painel Analítico do Organizador
  Como um Organizador
  Eu quero visualizar métricas consolidadas de vendas e check-in com gráficos Recharts
  Para acompanhar a receita e a taxa de comparecimento do meu evento

  Cenário: Visualização do dashboard analítico com evento filtrado
    Dado que meu evento possui 215 ingressos vendidos e R$ 38.200,00 faturados
    Quando eu acesso a rota "/organizer/analytics?eventId=evt_rock2026"
    Então o sistema deve exibir o total de receita "R$ 38.200,00"
    E deve exibir a taxa de ocupação de "93.48%"
    E deve renderizar os setores ordenados por receita em ordem decrescente
    E deve renderizar gráficos interativos com a biblioteca Recharts
    E deve permitir exportação real em CSV
```

---

# Caso de Uso: UC27 - Cancelamento de Ingresso com Devolução ao Estoque

## Plataforma de Eventos e Ingressos (Fase 3 - Diferenciais)

---

## 1. Identificação e Descrição

- **Identificador**: `UC27`
- **Classificação**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)
- **Nome**: Cancelamento Voluntário de Ingresso pelo Cliente com Devolução Automática ao Estoque
- **Objetivo**: Permitir que o cliente cancele ingressos adquiridos antes da data do evento, invalidando irreversivelmente o voucher e o QR Code no banco de dados, simulando o estorno do valor pago e devolvendo imediatamente a poltrona numerada ou vaga de pista de volta para a vitrine pública de vendas.

---

## 2. Atores

- **Cliente (`CUSTOMER`)**: Solicita o cancelamento de um ingresso específico.
- **Banco de Dados / Transação Atômica**: Transiciona o ingresso para `CANCELLED` e restaura o assento para `AVAILABLE`.

---

## 3. Pré-condições e Pós-condições

- **Pré-condição**:
  - O ingresso pertence ao cliente autenticado.
  - O ingresso está com status `ACTIVE` (não foi utilizado na portaria).
  - A data do evento ainda não ocorreu.
- **Pós-condição**:
  - O `Ticket` muda para status `CANCELLED`.
  - Se assento numerado, o `Seat` muda de `SOLD` para `AVAILABLE` (`isOccupied = false`).
  - Se setor de pista, o campo `availableCapacity` do setor é incrementado em +1.
  - O QR Code passa a ser rejeitado na portaria com o motivo `INVALID_CODE` ("Ingresso Cancelado").

---

## 4. Diagrama de Sequência

```mermaid
sequenceDiagram
    autonumber
    actor Cli as Cliente
    participant UI as Painel /my-tickets
    participant API as API de Cancelamento (/api/tickets/:id/cancel)
    participant DB as PostgreSQL (Prisma)

    Cli->>UI: Clica em "Cancelar Ingresso" no voucher
    UI->>Cli: Abre modal de confirmação: "Deseja realmente cancelar este ingresso? Esta ação é irreversível."
    Cli->>UI: Confirma o cancelamento
    UI->>API: POST /api/tickets/:id/cancel
    API->>DB: Inicia Transação Atômica:
    API->>DB: Valida se ticket.customerId == user.id e status == 'ACTIVE' e eventDate > NOW()
    API->>DB: UPDATE tickets SET status='CANCELLED', cancelledAt=NOW() WHERE id = :id
    API->>DB: UPDATE seats SET status='AVAILABLE', isOccupied=false WHERE id = ticket.seatId
    API->>DB: Registra log de reembolso no Order
    DB-->>API: Transação commitada com sucesso
    API-->>UI: 200 OK { success: true, message: "Ingresso cancelado com sucesso e valor estornado." }
    UI->>Cli: Atualiza card do voucher para status "CANCELADO" e exibe toast de sucesso
```

---

## 5. Fluxo Principal de Execução

1. O cliente autenticado acessa `/my-tickets`.
2. No card do ingresso ativo que deseja cancelar, clica no botão secundário **"Cancelar Ingresso"**.
3. Um modal de segurança é exibido:
   - Resumo do ingresso (Evento, Setor, Assento e Valor).
   - Informação de estorno: _"O valor de R$ XXX,XX será estornado no método original de pagamento."_.
   - Aviso de irreversibilidade: _"Após o cancelamento, seu QR Code será desativado e o assento voltará a ficar disponível para outros clientes."_.
4. O cliente clica no botão de confirmação **"Sim, Cancelar Ingresso"**.
5. O front-end dispara `POST /api/tickets/:id/cancel`.
6. O backend valida a regra e executa a transação atômica no banco de dados.
7. O status do ingresso muda para `CANCELLED`, o assento volta a ter status `AVAILABLE` na base de dados e a cota do setor é restaurada.
8. O modal fecha e o card do ingresso recebe uma sobreposição cinza com badge "Cancelado".
9. Outro visitante que estiver navegando na vitrine pode imediatamente selecionar e comprar aquele assento devolvido.

---

## 6. Fluxos Alternativos e Exceções

### Fluxo de Exceção 1: Tentativa de Cancelar Ingresso Já Utilizado

- **Condição**: O cliente tenta cancelar um ingresso cujo status já é `USED` (já realizou check-in).
- **Comportamento**: A API bloqueia a ação com `400 Bad Request`: _"Não é possível cancelar um ingresso que já foi utilizado na entrada do evento."_.

### Fluxo de Exceção 2: Tentativa de Cancelar Evento Já Realizado

- **Condição**: A data do evento já passou.
- **Comportamento**: O botão de cancelamento fica desabilitado na interface e a API recusa com `400 Bad Request` (_"Cancelamentos só são permitidos antes da realização do evento."_).

---

## 7. Regras de Negócio (RN)

- **RN01 - Bloqueio Pós-Check-in**: Ingressos com status `USED` nunca podem ser cancelados ou estornados.
- **RN02 - Restituição Automática de Estoque**: A devolução do assento ou incremento da cota de pista deve ocorrer obrigatoriamente na mesma transação atômica da mudança de status do ingresso.
- **RN03 - Desativação Imediata do QR Code**: O payload do QR Code cancelado deve ser sumariamente recusado na portaria.

---

## 8. Contratos de API

### Requisição: `POST /api/tickets/tkt_clx123456/cancel`

### Resposta de Sucesso: `HTTP 200 OK`

```json
{
  "success": true,
  "ticketId": "tkt_clx123456",
  "status": "CANCELLED",
  "seatRestored": "A1",
  "refundAmount": 250.0,
  "cancelledAt": "2026-08-14T03:58:00.000Z"
}
```

---

## 9. Critérios de Aceite (BDD / Gherkin)

```gherkin
Funcionalidade: Cancelamento de Ingressos com Devolução ao Estoque
  Como um Cliente
  Eu quero cancelar um ingresso que não poderei utilizar
  Para receber meu estorno e liberar a vaga para outro comprador

  Cenário: Cancelamento voluntário de assento numerado antes do evento
    Dado que possuo o ingresso ativo com a poltrona "A1" para um evento futuro
    Quando eu clico em "Cancelar Ingresso" e confirmo a operação
    Então o status do meu ingresso deve mudar para "CANCELLED"
    E a poltrona "A1" deve retornar imediatamente para o status "AVAILABLE" no mapa
    E o QR Code deste ingresso não deve mais permitir entrada na portaria
```

---

# Caso de Uso: UC28 - Sincronização em Tempo Real do Mapa de Assentos

## Plataforma de Eventos e Ingressos (Fase 3 - Diferenciais)

---

## 1. Identificação e Descrição

- **Identificador**: `UC28`
- **Classificação**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)
- **Nome**: Sincronização em Tempo Real do Mapa de Assentos via WebSockets / SSE
- **Objetivo**: Transmitir eventos de seleção, reserva (`seat:reserved`), liberação (`seat:released`) e venda definitiva (`seat:sold`) instantaneamente para todos os usuários que estiverem com a tela do mapa de assentos aberta, eliminando conflitos visuais e atualizando as cores das poltronas em tempo real sem necessidade de _refresh_ manual da página.

---

## 2. Atores

- **Clientes Concorrentes (Cliente A, Cliente B, Cliente C)**: Navegam e escolhem assentos ao mesmo tempo no mesmo evento.
- **Servidor de Eventos em Tempo Real (WebSockets / SSE Channel)**: Gerencia as salas por `eventId` e propaga broadcasts de alteração de assento.

---

## 3. Pré-condições e Pós-condições

- **Pré-condição**:
  - O cliente acessa o mapa de assentos de um evento e estabelece conexão WebSocket ou canal Server-Sent Events (SSE).
- **Pós-condição**:
  - A interface do cliente B reage instantaneamente aos cliques do cliente A, desabilitando assentos reservados por outros com tooltip dinâmico.

---

## 4. Diagrama de Sequência

```mermaid
sequenceDiagram
    autonumber
    actor CliA as Cliente A
    actor CliB as Cliente B
    participant UIA as UI Cliente A
    participant UIB as UI Cliente B
    participant WS as WebSocket / SSE Hub (Channel: event_evt_rock2026)
    participant API as API de Reservas

    CliA->>UIA: Clica no assento "B4" para reservar
    UIA->>API: POST /api/seats/reserve { seatIds: ["B4"] }
    API->>API: Reserva atômica no banco com sucesso
    API->>WS: Broadcast evento "seat:reserved" { seatId: "B4", reservedBy: "user_a" }

    WS-->>UIA: Evento confirmado: poltrona B4 fica AZUL (Selecionada por mim)
    WS-->>UIB: Broadcast recebido: poltrona B4 muda instantaneamente para AMARELO (Em reserva por outro cliente)
    UIB->>CliB: Exibe animação de bloqueio na poltrona B4 e impede novo clique
```

---

## 5. Fluxo Principal de Execução

1. Ao abrir o mapa de assentos de um evento, o front-end se inscreve no canal de eventos em tempo real do evento correspondente (`events/:id/live`).
2. Quando o **Cliente A** clica em uma poltrona disponível (ex: `C7`) e confirma o bloqueio:
   - A API backend processa a reserva e dispara um payload de broadcast para a sala do evento:
     ```json
     {
       "type": "SEAT_STATUS_CHANGED",
       "eventId": "evt_rock2026",
       "seatId": "seat_c7_uuid",
       "seatLabel": "C7",
       "newStatus": "RESERVED",
       "reservedUntil": "2026-08-14T04:10:00.000Z"
     }
     ```
3. A tela do **Cliente B**, que estava visualizando o mesmo mapa:
   - Recebe a mensagem via WebSocket/SSE em milissegundos.
   - Aplica uma transição visual suave na poltrona `C7`, alterando a cor de verde para amarelo.
   - Adiciona um tooltip: _"Poltrona em processo de compra por outro usuário"_.
   - Desabilita o clique sobre o assento `C7`.
4. Se o Cliente A concluir a compra, o evento `SEAT_SOLD` transforma a poltrona em cinza escuro (_"Ocupada"_).
5. Se a reserva do Cliente A expirar ou for cancelada, o evento `SEAT_RELEASED` restaura a cor verde (_"Disponível"_) para todos os clientes conectados.

---

## 6. Fluxos Alternativos e Exceções

### Fluxo Alternativo 1: Queda ou Falha de Conexão WebSocket

- **Cenário**: O dispositivo móvel perde o sinal Wi-Fi momentaneamente.
- **Comportamento**: O cliente WebSocket tenta reconectar automaticamente com _exponential backoff_ e realiza uma consulta HTTP REST para ressincronizar o estado completo da sala ao restabelecer a conexão.

---

## 7. Regras de Negócio (RN)

- **RN01 - Isolamento por Canal de Evento**: Usuários recebem apenas eventos do `eventId` que estão visualizando no momento, evitando sobrecarga de mensagens no cliente.
- **RN02 - Fallback Gracioso (Progressive Enhancement)**: Se o cliente estiver em uma rede que bloqueia WebSockets, a aplicação deve continuar funcionando perfeitamente através de polling HTTP curto ou validação na tentativa de reserva.

---

## 8. Contratos de Eventos em Tempo Real

### Payload de Broadcast: `SEAT_STATUS_CHANGED`

```json
{
  "event": "seat:status_update",
  "data": {
    "seatId": "seat_c7_uuid",
    "seatLabel": "C7",
    "status": "RESERVED",
    "reservedUntil": "2026-08-14T04:10:00.000Z"
  }
}
```

---

## 9. Critérios de Aceite (BDD / Gherkin)

```gherkin
Funcionalidade: Sincronização em Tempo Real do Mapa de Assentos
  Como dois Clientes navegando simultaneamente no mesmo evento
  Nós queremos ver as mudanças de status dos assentos em tempo real
  Para não clicar em assentos que já estão sendo comprados

  Cenário: Atualização instantânea de assento reservado por outro cliente
    Dado que o Cliente A e o Cliente B estão com o mapa do evento aberto
    Quando o Cliente A reserva a poltrona "C7"
    Então a poltrona "C7" na tela do Cliente B deve mudar imediatamente para a cor amarela (Em Reserva)
    E o Cliente B não deve conseguir clicar na poltrona "C7"
```

---

# Caso de Uso: UC29 - Containerização e Orquestração com Docker Compose

## Plataforma de Eventos e Ingressos (Fase 3 - Diferenciais)

---

## 1. Identificação e Descrição

- **Identificador**: `UC29`
- **Classificação**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)
- **Nome**: Containerização e Orquestração do Ambiente Completo com Docker Compose
- **Objetivo**: Permitir que avaliadores e desenvolvedores executem todo o ecossistema da aplicação (Aplicação Fullstack Next.js, Banco de Dados PostgreSQL 16 e execução automática de migrações e seed) com um único comando (`docker compose up --build`), garantindo reprodutibilidade idêntica em qualquer sistema operacional sem exigir instalação de dependências locais.

---

## 2. Atores

- **Avaliador / Desenvolvedor**: Inicializa o ambiente com comandos do Docker CLI.
- **Docker Engine / Compose**: Compila as imagens com _multi-stage build_ e orquestra a rede interna e volumes persistentes.

---

## 3. Pré-condições e Pós-condições

- **Pré-condição**:
  - O Docker e o Docker Compose estão instalados na máquina do avaliador.
- **Pós-condição**:
  - Os containers `app` (Next.js) e `postgres` sobem saudáveis na mesma rede virtual.
  - O banco de dados é inicializado, as migrações Prisma são aplicadas e os dados de teste (seed) são carregados automaticamente.
  - A aplicação responde em `http://localhost:3000`.

---

## 4. Diagrama de Sequência de Inicialização

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Avaliador / Dev
    participant CLI as Terminal / Docker CLI
    participant Compose as Docker Compose Engine
    participant DBContainer as Container PostgreSQL (Porta 5432)
    participant AppContainer as Container Next.js App (Porta 3000)

    Dev->>CLI: Executa "docker compose up --build"
    CLI->>Compose: Lê docker-compose.yml e Dockerfile
    Compose->>DBContainer: Inicializa container postgres com healthcheck
    Note over DBContainer: Aguarda status "healthy" (pg_isready)
    Compose->>AppContainer: Inicia build multi-stage (deps -> builder -> runner)
    DBContainer-->>Compose: Status HEALTHY confirmado
    Compose->>AppContainer: Dispara script de entrypoint:
    Note over AppContainer: 1. npx prisma db push / migrate deploy<br/>2. npm run db:seed<br/>3. npm run start / node server.js
    AppContainer-->>Compose: Porta 3000 aberta e pronta
    Compose-->>Dev: Exibe logs de sucesso e URL http://localhost:3000
```

---

## 5. Fluxo Principal de Execução

1. O avaliador clona o repositório e navega até a pasta raiz.
2. Executa no terminal:
   ```bash
   docker compose up --build
   ```
3. O Docker Compose cria a rede interna `verzel-network` e os volumes para persistência dos dados do banco.
4. O container `ticket_db` (PostgreSQL 16 Alpine) é iniciado com variáveis de ambiente pré-configuradas.
5. O container `ticket_app` aguarda a verificação de saúde do banco de dados (`depends_on.ticket_db.condition: service_healthy`).
6. Quando o PostgreSQL fica pronto para conexões, o entrypoint do `ticket_app` executa:
   - Sincronização do schema com o banco (`npx prisma migrate deploy`).
   - Carga do pipeline de seed (`npm run db:seed`), criando os 4 usuários de teste e o evento modelo.
   - Inicialização do servidor web na porta `3000`.
7. O terminal imprime o resumo de inicialização com as credenciais de teste disponíveis.
8. O avaliador acessa `http://localhost:3000` no navegador e testa a aplicação imediatamente.

---

## 6. Fluxos Alternativos e Exceções

### Fluxo Alternativo 1: Execução em Segundo Plano (Modo Detached)

- **Comando**: `docker compose up -d`
- **Comportamento**: Os containers sobem em background e o usuário pode acompanhar os logs com `docker compose logs -f app`.

---

## 7. Regras de Negócio e Infraestrutura (RN)

- **RN01 - Multi-Stage Build**: O `Dockerfile` deve conter estágios separados (`base`, `dependencies`, `builder`, `runner`) com usuário não-root (`USER nextjs`) para otimização de tamanho de imagem e segurança em produção.
- **RN02 - Persistência em Volume Nomeado**: Os dados do banco de dados relacional devem ser montados em um volume nomeado (`postgres_data`) para preservar o estado caso o container seja reiniciado.
- **RN03 - Carga Automática de Seed no Boot**: O container da aplicação deve garantir que os dados de teste estejam presentes sem intervenção manual do usuário.

---

## 8. Exemplo do Arquivo `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ticket_platform_postgres
    restart: always
    environment:
      POSTGRES_USER: verzel_user
      POSTGRES_PASSWORD: verzel_password
      POSTGRES_DB: ticket_platform_db
    ports:
      - '5433:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U verzel_user -d ticket_platform_db']
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ticket_platform_app
    restart: always
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: 'postgresql://verzel_user:verzel_password@postgres:5432/ticket_platform_db?schema=public'
      DIRECT_URL: 'postgresql://verzel_user:verzel_password@postgres:5432/ticket_platform_db?schema=public'
      AUTH_SECRET: 'super_secret_jwt_key_ticket_platform_2026_production'
      QR_HMAC_SECRET: 'super_secret_hmac_key_for_qr_code_signature_2026'
      NODE_ENV: 'production'
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

---

## 9. Critérios de Aceite (BDD / Gherkin)

```gherkin
Funcionalidade: Execução do Ambiente com Docker Compose
  Como um Avaliador do Desafio
  Eu quero executar "docker compose up --build"
  Para ter toda a aplicação rodando com banco e seed sem configurar nada manualmente

  Cenário: Inicialização completa via Docker Compose
    Dado que possuo o Docker instalado
    Quando eu executo "docker compose up --build" no terminal
    Então o container do PostgreSQL deve iniciar e passar no healthcheck
    E o container da aplicação deve aplicar as migrações e o seed de dados automaticamente
    E a aplicação deve ficar acessível em "http://localhost:3000"
```

---

# Caso de Uso: UC30 - Bateria Completa de Testes Automatizados

## Plataforma de Eventos e Ingressos (Fase 3 - Diferenciais)

---

## 1. Identificação e Descrição

- **Identificador**: `UC30`
- **Classificação**: 🟢 OPCIONAL (Diferencial de Excelência / Bônus)
- **Nome**: Execução da Suíte Completa de Testes Automatizados (Unitários, Concorrência e E2E)
- **Objetivo**: Fornecer uma suíte automatizada de testes robusta cobrindo os pontos críticos do sistema: testes unitários (criptografia HMAC e regras RBAC), testes de integração e concorrência (prevenção de _double-booking_ e validação dupla na portaria) e testes de ponta a ponta (E2E com Playwright) cobrindo a jornada completa: Login -> Escolha de Evento -> Reserva de Assento -> Checkout -> Emissão de Ingresso -> Validação na Portaria.

---

## 2. Atores

- **Engenheiro de Testes / Avaliador**: Dispara os comandos de teste no terminal (`npm test`, `npm run test:e2e`).
- **Framework de Testes (Vitest / Jest & Playwright)**: Executa as asserções e gera relatórios de cobertura.

---

## 3. Pré-condições e Pós-condições

- **Pré-condição**:
  - As dependências do projeto estão instaladas.
- **Pós-condição**:
  - 100% dos testes da suíte são executados com sucesso (status verde / exit code 0).
  - Relatório de cobertura e logs de asserção são impressos no terminal.

---

## 4. Estrutura da Pirâmide de Testes

```mermaid
flowchart TD
    subgraph Suite["Suíte de Testes Automatizados"]
        E2E["Testes E2E (Playwright)<br/>Jornada Completa: Cadastro -> Compra -> QR Code -> Portaria"]
        Integration["Testes de Integração & Concorrência (Vitest)<br/>Race Conditions em Assentos e Catracas Simultâneas"]
        Unit["Testes Unitários (Vitest)<br/>Assinatura HMAC-SHA256, Middleware RBAC e Schemas Zod"]

        Unit --> Integration --> E2E
    end
```

---

## 5. Cenários de Teste Essenciais Cobertos

### 5.1 Testes Unitários (`/tests/unit`)

1. **Assinatura Criptográfica do QR Code**:
   - Geração de payload assinado válido.
   - Verificação de rejeição imediata quando 1 único caractere do hash é alterado.
   - Verificação de integridade com timestamps e chaves secretas distintas.
2. **Middleware e Validação de Papéis (RBAC)**:
   - Permissão de rotas públicas para visitantes anônimos.
   - Bloqueio de clientes acessando `/organizer` (403 Forbidden).
   - Bloqueio de organizadores acessando `/gatekeeper` (403 Forbidden).

### 5.2 Testes de Concorrência e Integração (`/tests/integration`)

1. **Teste de Corrida Anti-Double Booking**:
   - Disparo simultâneo (`Promise.all`) de 10 requisições concorrentes para reservar o mesmo assento `A1`.
   - **Asserção**: Exatamente 1 requisição recebe HTTP 200/201 (Sucesso) e 9 requisições recebem HTTP 409 (Conflito).
2. **Teste de Concorrência na Portaria**:
   - Disparo simultâneo de validação para o mesmo QR Code em duas conexões paralelas.
   - **Asserção**: Exatamente 1 conexão recebe status `VALID` e a outra recebe `ALREADY_USED`.

### 5.3 Testes End-to-End (`/tests/e2e`)

1. **Jornada de Compra e Check-in Ponta a Ponta**:
   - Autenticação como Cliente.
   - Navegação na vitrine e abertura do evento modelo.
   - Seleção do assento `A1` no mapa interativo.
   - Conclusão do checkout com "Simular Pagamento Aprovado".
   - Verificação da presença do voucher com QR Code na área "Meus Ingressos".
   - Autenticação como Portaria em outra aba.
   - Validação do código do ingresso emitido e verificação da mensagem "ACESSO LIBERADO".

---

## 6. Comandos de Execução

```bash
# Executa todos os testes unitários e de integração
npm test

# Executa testes com relatório de cobertura de código
npm run test:coverage

# Executa a bateria de testes End-to-End com Playwright
npm run test:e2e
```

---

## 7. Regras de Negócio e Qualidade (RN)

- **RN01 - Isolamento de Ambiente de Teste**: Os testes de integração devem executar em banco de dados isolado ou transações com rollback automático para não sujar dados de produção.
- **RN02 - Zero Flakiness**: Os testes de concorrência devem utilizar primitivas assíncronas determinísticas para evitar falsos positivos.

---

## 8. Critérios de Aceite (BDD / Gherkin)

```gherkin
Funcionalidade: Bateria Completa de Testes Automatizados
  Como um Engenheiro de Software
  Eu quero executar a suíte de testes automatizados
  Para garantir a confiabilidade e integridade das regras críticas da plataforma

  Cenário: Execução bem-sucedida de todos os testes unitários e de concorrência
    Dado que o ambiente de testes está configurado
    Quando eu executo o comando "npm test" no terminal
    Então todos os testes de criptografia HMAC, RBAC, anti-double booking e portaria devem passar com 100% de sucesso
    E o processo deve encerrar com exit code 0
```

---
