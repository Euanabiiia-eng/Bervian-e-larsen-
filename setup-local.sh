#!/bin/bash
set -e

echo "=== Ápice — Setup Local ==="
echo ""

# 1. Verificar .env
if [ ! -f ".env" ]; then
  echo "Criando .env com valores locais..."
  cat > .env <<EOF
ANTHROPIC_API_KEY=sk-ant-COLOQUE_SUA_CHAVE_AQUI
EOF
  echo "  AVISO: Edite o arquivo .env e coloque sua ANTHROPIC_API_KEY"
  echo "  Obtenha em: https://console.anthropic.com/keys"
  echo ""
fi

# 2. Subir containers
echo "Subindo banco de dados e Redis..."
docker compose up -d postgres redis
echo "  Aguardando banco ficar pronto..."
sleep 5

# 3. Instalar dependências
echo "Instalando dependências..."
npm install

# 4. Migrar banco
echo "Criando tabelas..."
DATABASE_URL=postgresql://apice:apice2026@localhost:5432/apice_dev \
  npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma 2>/dev/null || \
  DATABASE_URL=postgresql://apice:apice2026@localhost:5432/apice_dev \
  npx prisma migrate dev --schema=apps/api/prisma/schema.prisma --name init

# 5. Seed
echo "Populando dados demo..."
DATABASE_URL=postgresql://apice:apice2026@localhost:5432/apice_dev \
  npx prisma db seed --schema=apps/api/prisma/schema.prisma

echo ""
echo "=== Pronto! ==="
echo ""
echo "Para iniciar tudo:"
echo "  Terminal 1: docker compose up api"
echo "  Terminal 2: cd apps/web && npm run dev"
echo "  Terminal 3: cd apps/mobile && npx expo start --tunnel"
echo ""
echo "Credenciais demo:"
echo "  Admin web:  admin@bervianlarsen.com.br / apice2026"
echo "  Paciente:   fernanda@email.com / apice2026"
