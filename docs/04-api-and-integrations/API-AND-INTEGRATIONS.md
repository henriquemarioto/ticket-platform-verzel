# Integrações e Contratos de API

Este documento consolida as integrações com APIs externas (TMDb e Ticketmaster), simulação de gateway de pagamento e os schemas de validação Zod / DTOs.

> Para a especificação OpenAPI/Swagger completa e testável, consulte [OPENAPI-SPEC.yaml](./OPENAPI-SPEC.yaml).

---

# Integrações com Serviços de Terceiros

Este documento detalha as integrações com APIs e serviços externos.

---

## 1. The Movie Database (TMDb)
- **Finalidade**: Consulta de filmes populares e busca por títulos para autocompletar eventos de cinema.
- **Endpoint Utilizado**:
  - Busca: `GET https://api.themoviedb.org/3/search/movie?query={query}&language=pt-BR`
  - Imagens de Cartaz: `https://image.tmdb.org/t/p/w780{poster_path}`
- **Autenticação**: Via header `Authorization: Bearer TMDB_API_KEY` ou parâmetro `api_key`.
- **Estratégia de Resiliência & Mock Fallback**: Caso a variável `TMDB_API_KEY` não esteja presente no `.env` ou o serviço externo retorne erro de rate limit/indisponibilidade (HTTP 429/5xx), o backend ativa automaticamente o catálogo mock embutido com filmes populares pré-populados (ex: *Duna: Parte 2*, *Oppenheimer*, *Interestelar*, *A Origem*), permitindo que qualquer avaliador teste o fluxo sem depender de chave de API.

---

## 2. Ticketmaster Discovery API
- **Finalidade**: Consulta de concertos, festivais e shows de música.
- **Endpoint Utilizado**:
  - Busca: `GET https://app.ticketmaster.com/discovery/v2/events.json?keyword={query}&apikey={TICKETMASTER_API_KEY}`
- **Mapeamento**:
  - Título: `name`
  - Imagem: `images[0].url`
  - Local: `_embedded.venues[0].name` e `_embedded.venues[0].city.name`
- **Estratégia de Resiliência & Mock Fallback**: Se `TICKETMASTER_API_KEY` estiver ausente ou offline, o backend retorna instantaneamente itens de show mockados (ex: *Coldplay - Music of the Spheres*, *Imagine Dragons - Loom World Tour*, *Iron Maiden - The Future Past Tour*), garantindo navegabilidade e autopreenchimento imediato.

---

## 3. Simulação de Gateway de Pagamento
- **Finalidade**: Processamento fictício de transações de compra de ingressos.
- **Mecanismo**: Módulo interno de simulação com atraso artificial de 800ms para simulação de rede e suporte aos botões explícitos "Aprovar" e "Recusar".


---

## 4. Google Maps Embed & Deep Links de Navegação
- **Finalidade**: Exibição interativa e visualização espacial do local físico do evento em `/events/:id`.
- **Mecanismo Gratuito**:
  - Utiliza o endpoint público de iframe: `https://maps.google.com/maps?q={encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`.
  - Zero dependência de chaves de API restritas (`GOOGLE_MAPS_API_KEY`) ou cadastros pagos.
- **Deep Links Externos Integrados**:
  - **Google Maps**: `https://www.google.com/maps/dir/?api=1&destination={encodedLocation}`
  - **Waze**: `https://waze.com/ul?q={encodedLocation}`
  - **Apple Maps**: `https://maps.apple.com/?daddr={encodedLocation}`

---

# Contratos de Autenticação (DTOs e Schemas Zod)

Este documento define os schemas e tipos de dados utilizados nos fluxos de autenticação.

---

## 1. Schema de Login (`loginSchema`)

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Insira um endereço de e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

---

## 2. Schema de Registro (`registerSchema`)

```typescript
import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Insira um endereço de e-mail válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["CUSTOMER", "ORGANIZER"]).default("CUSTOMER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas informadas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
```

---

# Contratos de Eventos e Setores (DTOs e Schemas Zod)

Este documento estabelece os contratos de criação, gestão de status e consulta de mapa de assentos.

---

## 1. Schema de Criação de Evento (`createEventSchema`)

```typescript
import { z } from "zod";

export const createSectorSchema = z.object({
  name: z.string().min(2, "Nome do setor é obrigatório"),
  type: z.enum(["GENERAL_ADMISSION", "NUMBERED_SEATS"]),
  price: z.number().positive("O valor deve ser maior que zero"),
  totalCapacity: z.number().int().positive("Capacidade deve ser positiva"),
  rowsCount: z.number().int().optional(),
  seatsPerRow: z.number().int().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Título do evento é obrigatório"),
  description: z.string().min(300, "A descrição do evento deve conter no mínimo 300 caracteres"),
  category: z.enum(["SHOW", "MOVIE", "THEATER", "FESTIVAL"]),
  isAdult: z.boolean().optional().default(false),
  bannerUrl: z.string().url("URL de imagem válida é obrigatória").or(z.literal("")),
  locationName: z.string().min(2, "Nome do local é obrigatório"),
  city: z.string().min(4, "Cidade e UF são obrigatórios").regex(/^.+,\s*[A-Z]{2}$/, "Formato deve ser 'Cidade, UF'"),
  eventDate: z.string().datetime("Data e hora válidas são obrigatórias"),
  sectors: z.array(createSectorSchema).min(1, "Adicione ao menos um setor"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
```

---

## 2. Schema de Edição de Evento (`updateEventSchema`) e Atualização (`PUT /api/events/:id`)

```typescript
import { z } from "zod";

export const updateEventSchema = z.object({
  title: z.string().min(3, "Título do evento é obrigatório"),
  description: z.string().min(300, "A descrição do evento deve conter no mínimo 300 caracteres"),
  category: z.enum(["SHOW", "MOVIE", "THEATER", "FESTIVAL"]),
  bannerUrl: z.string().url("URL de imagem válida é obrigatória").or(z.literal("")),
  locationName: z.string().min(2, "Nome do local é obrigatório"),
  city: z.string().min(4, "Cidade e UF são obrigatórios").regex(/^.+,\s*[A-Z]{2}$/, "Formato deve ser 'Cidade, UF'"),
  eventDate: z.string().datetime("Data e hora válidas são obrigatórias"),
  isAdult: z.boolean().optional().default(false),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
```

- **Acesso**: Restrito a `ORGANIZER` com validação de posse (`event.organizerId === user.id`).
- **Respostas**: `200 OK` em caso de sucesso; `400 Bad Request` em caso de validação Zod; `401 Unauthorized` se não autenticado; `403 Forbidden` se não for dono do evento; `404 Not Found` se o evento não existir.

---

## 3. Schema de Alteração de Status (`updateEventStatusSchema`)

```typescript
import { z } from "zod";

export const updateEventStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]),
});

export type UpdateEventStatusInput = z.infer<typeof updateEventStatusSchema>;
```

---

## 3. Consulta e Busca Pública de Eventos (`GET /api/events`)

Endpoint público que lista eventos publicados, suportando filtros por termo textual (`q`) e categoria (`category`):

- **Query Params**:
  - `q`: string (termo de busca em título, descrição ou cidade)
  - `category`: `SHOW` | `MOVIE` | `THEATER` | `FESTIVAL`
  - `status`: padrão `PUBLISHED`
- **Acesso**: Público (sem necessidade de autenticação)

```typescript
export interface EventsListResponse {
  success: boolean;
  total: number;
  events: Array<{
    id: string;
    title: string;
    description: string;
    category: "SHOW" | "MOVIE" | "THEATER" | "FESTIVAL";
    isAdult: boolean;
    bannerUrl: string;
    locationName: string;
    city: string;
    eventDate: string;
    minPrice: number;
    status: string;
  }>;
}
```

---

## 4. Consulta de Mapa de Assentos (`GET /api/events/[id]/seats`)

Executa *lazy expiration* de bloqueios temporários expirados (`reservedUntil < NOW()`) e retorna o grid atualizado:

```typescript
export interface EventSeatsResponse {
  sectors: Array<{
    id: string;
    name: string;
    type: "GENERAL_ADMISSION" | "NUMBERED_SEATS";
    price: number;
    totalCapacity: number;
    availableCapacity: number;
    seats: Array<{
      id: string;
      row: string;
      number: number;
      status: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED";
      reservedUntil: string | null;
      isMine?: boolean;
    }>;
  }>;
}
```

---

# Contratos de Ingressos, Reservas, Checkout e Portaria

Este documento estabelece os contratos de reserva temporária, checkout, gestão de vouchers e validação na portaria.

---

## 1. Schemas de Reserva Temporária (Anti-Double Booking & TTL)

```typescript
import { z } from "zod";

export const reserveSeatsSchema = z.object({
  eventId: z.string().optional(),
  sectorId: z.string().optional(),
  seatIds: z.array(z.string().min(1)).min(1, "Selecione ao menos 1 assento").max(6, "Máximo de 6 assentos por pedido"),
});

export type ReserveSeatsInput = z.infer<typeof reserveSeatsSchema>;

export const reservePistaSchema = z.object({
  eventId: z.string().min(1, "ID do evento obrigatório"),
  sectorId: z.string().min(1, "ID do setor obrigatório"),
  quantity: z.number().int().min(1, "Mínimo 1 ingresso").max(6, "Máximo de 6 ingressos por compra"),
});

export type ReservePistaInput = z.infer<typeof reservePistaSchema>;
```

> [!IMPORTANT]
> **Restrição de Papel nas Reservas**: Apenas usuários com papel `CUSTOMER` podem criar reservas de pista ou assentos. Caso um `ORGANIZER` envie uma requisição para `/api/reservations/general-admission` ou `/api/seats/reserve`, a API retorna `HTTP 403 Forbidden` com `{ error: "Organizadores não podem comprar ingressos. Faça login como cliente.", code: "ORGANIZER_CANNOT_BUY" }`.

---

## 2. Schema de Checkout (`checkoutSchema`)

```typescript
import { z } from "zod";

export const checkoutSchema = z.object({
  reservationId: z.string().min(1, "ID de reserva temporária obrigatório"),
  paymentMethod: z.enum(["SIMULATED_CREDIT_CARD", "SIMULATED_PIX"]).default("SIMULATED_CREDIT_CARD"),
  action: z.enum(["APPROVE", "REJECT"]).default("APPROVE"),
  reason: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
```

---

## 3. Painel Meus Ingressos (`GET /api/my-tickets`)

```typescript
export interface MyTicketsResponse {
  activeTickets: Array<TicketItem>;
  pastTickets: Array<TicketItem>;
}

export interface TicketItem {
  id: string;
  ticketCode: string;
  qrPayload: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  shareToken: string;
  event: {
    id: string;
    title: string;
    eventDate: string;
    locationName: string;
    city: string;
    bannerUrl: string;
  };
  sector: {
    name: string;
    price: number;
  };
  seat?: {
    row: string;
    number: number;
  } | null;
}
```

---

## 4. Compartilhamento Seguro (`POST /api/tickets/[id]/share`)

```typescript
export interface ShareTicketResponse {
  success: boolean;
  shareToken: string;
  shareUrl: string; // Ex: /tickets/share/stk_abc123?key=f4d9a1
  passcode: string;
}
```

---

## 5. Eventos Operacionais da Portaria (`GET /api/gate/events`)

```typescript
export interface GatekeeperEventItem {
  id: string;
  title: string;
  eventDate: string;
  locationName: string;
  city: string;
  status: string;
  totalSold: number;
  totalValidated: number;
}
```

---

## 6. Schema de Validação de Portaria (`validateTicketSchema`)

```typescript
import { z } from "zod";

export const validateTicketSchema = z.object({
  eventId: z.string().min(1, "ID de evento obrigatório"),
  payload: z.string().min(1).optional(),
  qrPayload: z.string().min(1).optional(),
  ticketCode: z.string().min(1).optional(),
}).refine((data) => data.payload || data.qrPayload || data.ticketCode, {
  message: "Informe o payload do QR Code ou o código do ingresso",
});

export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;

export interface ValidateTicketResponse {
  result: "VALID" | "ALREADY_USED" | "WRONG_EVENT" | "INVALID_CODE";
  message: string;
  ticket?: {
    ticketCode: string;
    customerName: string;
    sectorName: string;
    seatInfo?: string;
    usedAt?: string;
  };
}
```

