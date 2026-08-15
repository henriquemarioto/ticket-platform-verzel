# Diagramas de Fluxo de Dados

Este documento mapeia os três fluxos de dados mais críticos da aplicação.

---

## 1. Fluxo de Compra e Emissão de Ingressos

```mermaid
flowchart TD
    A["Cliente Seleciona Assento ou Qtd de Pista"] --> B["Backend Bloqueia Assento (status: RESERVED, TTL 10m)"]
    B --> C["Cliente Preenche Pagamento no Checkout"]
    C --> D{"Pagamento Aprovado?"}
    
    D -- "Sim" --> E["Gera Pedido (Order: APPROVED)"]
    E --> F["Marca Assentos como SOLD"]
    F --> G["Gera Ingressos com ticketCode, shareToken e HMAC(secureToken)"]
    G --> H["Exibe Ingressos em 'Meus Ingressos'"]
    
    D -- "Não" --> I["Marca Pedido como REJECTED"]
    I --> J["Libera Assentos de Volta para AVAILABLE"]
    J --> K["Exibe Mensagem de Recusa"]
```

---

## 2. Fluxo de Validação de Portaria

```mermaid
flowchart TD
    A1["Operador Escaneia QR Code ou Digita Código"] --> B1["API Recebe Payload de Validação"]
    B1 --> C1{"Assinatura HMAC é Válida?"}
    
    C1 -- "Não" --> D1["Retorna INVALID_CODE (Alerta Fraude)"]
    C1 -- "Sim" --> E1{"Evento do Ingresso coincide com Evento Selecionado?"}
    
    E1 -- "Não" --> F1["Retorna WRONG_EVENT"]
    E1 -- "Sim" --> G1{"Ingresso já foi Usado (status == USED)?"}
    
    G1 -- "Sim" --> H1["Retorna ALREADY_USED (Exibe hora do 1º check-in)"]
    G1 -- "Não" --> I1["Atualiza status para USED (usedAt = NOW)"]
    I1 --> J1["Registra Log de Validação"]
    J1 --> K1["Retorna VALID (Acesso Liberado)"]
```
