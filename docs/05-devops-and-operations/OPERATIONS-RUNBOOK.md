# Runbook de Operações, Rollback e Monitoramento

Este documento orienta os procedimentos de emergência, reversão de migrações em produção e estratégia de observabilidade/logs.

---

# Runbook: Procedimentos de Rollback e Reset de Banco de Dados

Este documento orienta o time de engenharia em cenários de emergência ou corrupção de schema no banco de dados.

---

## 1. Reset Completo em Ambiente de Desenvolvimento
Para limpar completamente o banco local e repovoar com os dados de teste:
```bash
npx prisma migrate reset --force
npm run db:seed
```

---

## 2. Reversão de Migração com Falha em Produção

> **IMPORTANTE**: Todos os comandos da CLI do Prisma (`migrate status`, `migrate resolve`, `migrate deploy`, `db push`) devem obrigatoriamente ser executados com a variável `DIRECT_URL` apontando para a porta direta `5432` do Supabase. A porta de pooler `6543` não suporta operações de DDL e travas `pg_advisory_lock`.

1. Identifique a migração com problema:
   ```bash
   npx prisma migrate status
   ```
2. Marque a migração como resolvida ou revertida:
   ```bash
   npx prisma migrate resolve --rolled-back "nome_da_migracao"
   ```
3. Aplique o script SQL corretivo de rollback manual e reexecute o deploy via CI/CD.



---

# Runbook: Monitoramento, Observabilidade e Logs de Auditoria

Este documento estabelece as diretrizes de monitoramento e auditoria da plataforma.

---

## 1. Logs Estruturados de Check-in na Portaria
Todas as tentativas de validação de ingressos são persistidas na tabela `ticket_validation_logs`:
- `ticketId`: Ingresso avaliado (se identificado).
- `gatekeeperId`: Identificador do operador logado.
- `result`: `VALID`, `ALREADY_USED`, `WRONG_EVENT` ou `INVALID_CODE`.
- `rawPayload`: String bruta capturada pelo scanner.
- `message`: Motivo legível registrado.
- `validatedAt`: Timestamp exato em UTC.

---

## 2. Auditoria de Tentativas de Fraude
Para investigar alertas de ingressos adulterados ou códigos forjados:
```sql
SELECT * FROM ticket_validation_logs 
WHERE result = 'INVALID_CODE' 
ORDER BY "validatedAt" DESC 
LIMIT 50;
```


---

