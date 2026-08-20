#!/bin/sh
set -e

echo "=> [Entrypoint] Inicializando container Ticket Platform..."

# Executa migrações do Prisma se DATABASE_URL estiver configurada
if [ -n "$DATABASE_URL" ]; then
  echo "=> [Entrypoint] DATABASE_URL detectada. Executando migrações do banco de dados..."
  npx prisma migrate deploy || npx prisma db push
  
  if [ "$APP_ENV" = "production" ] || { [ "$NODE_ENV" = "production" ] && [ "$APP_ENV" != "development" ] && [ "$APP_ENV" != "local" ]; }; then
    echo "=> [Entrypoint] Ambiente de produção detectado. Pulando execução de seed de teste."
  else
    echo "=> [Entrypoint] Executando carga de dados (seed inteligente)..."
    npx prisma db seed || echo "=> [Entrypoint] Aviso: Falha ao executar o seed."
  fi
fi

echo "=> [Entrypoint] Inicializando servidor Next.js..."
exec "$@"
