# Plataforma Ápice by Black Premium

SaaS multi-clínica para clínicas de cirurgia plástica premium. Piloto: **Clínica Bervian & Larsen** (Porto Alegre/RS).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | Node.js + Express + Prisma + PostgreSQL |
| Admin | Next.js 14 (App Router) + Tailwind CSS + Recharts |
| Mobile | React Native + Expo SDK 51 (Expo Router) |
| IA | Anthropic claude-sonnet-4-6 |
| Cache/Auth | Redis (Upstash compatível) |
| Monorepo | Turborepo + npm workspaces |

## Estrutura

```
/
├── apps/
│   ├── api/          # Backend Express + Prisma
│   ├── web/          # Painel admin Next.js
│   └── mobile/       # App paciente React Native/Expo
├── packages/
│   ├── types/        # Tipos TypeScript compartilhados
│   └── utils/        # Funções utilitárias compartilhadas
└── turbo.json
```

## Pré-requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Redis (local ou Upstash)
- Conta Anthropic com API key

## Setup

### 1. Variáveis de ambiente

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env
```

Edite cada arquivo com seus valores reais.

### 2. Instalar dependências

```bash
npm install
```

### 3. Banco de dados

```bash
# Gerar cliente Prisma
npx prisma generate --schema=apps/api/prisma/schema.prisma

# Criar e migrar banco
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma --name init

# Popular com dados demo
npx prisma db seed --schema=apps/api/prisma/schema.prisma
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Isso inicia simultaneamente:
- API em `http://localhost:3001`
- Web admin em `http://localhost:3000`
- Mobile via Expo (scan QR no terminal)

## Credenciais Demo

### Painel Admin (web)

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | admin@bervianlarsen.com.br | apice2026 |
| Dr. Fabrício Bervian | fabricio@bervianlarsen.com.br | apice2026 |
| Dr. Guilherme Larsen | guilherme@bervianlarsen.com.br | apice2026 |

### App Paciente (mobile)

| E-mail | Senha |
|--------|-------|
| fernanda@email.com | apice2026 |

## Funcionalidades

### Painel Admin
- **Dashboard** — KPIs de receita, cirurgias e engajamento com gráficos mensais
- **Pipeline** — Kanban drag-and-drop de leads (lead → consulta → proposta → fechamento)
- **Cirurgias** — Agenda com status, confirmações e marcação de realizadas
- **Pacientes** — Gestão completa com jornada pós-op, documentos e checklist
- **Mensagens** — Fila de aprovação para respostas de IA sensíveis
- **Procedimentos** — CRUD com vídeos informativos e respostas de IA
- **Hospitais / Médicos** — Cadastros de infraestrutura

### App Paciente
- **Início** — Progresso da jornada pós-op com timeline de 8 etapas
- **Documentos** — Receitas, orientações, termos de internação
- **Vídeos** — Conteúdo educativo personalizado por procedimento
- **Chat** — IA em 3 camadas (resposta rápida → IA → fila de aprovação)
- **Perfil** — Dados da cirurgia, médico, hospital e contato de emergência

### IA em 3 camadas
1. **Respostas rápidas** — Keywords configuradas por procedimento (sem latência)
2. **IA generativa** — claude-sonnet-4-6 com contexto completo do paciente
3. **Fila de aprovação** — Mensagens sensíveis aguardam revisão da equipe

### Automações (cron)
- **T-72h** — Checklist pré-operatório enviado ao paciente
- **T-24h** — Lembrete de jejum e horário de chegada
- **T-2h** — Notificação interna para equipe cirúrgica
- **D+1** — Liberação de documentos pós-alta, atualização de status
- **D+14** — Gatilho para NPS

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Chave secreta para JWT (mín. 32 chars) |
| `REDIS_URL` | URL Redis (local ou Upstash) |
| `ANTHROPIC_API_KEY` | Chave da API Anthropic |
| `PORT` | Porta da API (padrão: 3001) |
| `NEXT_PUBLIC_API_URL` | URL da API para o Next.js |
| `EXPO_PUBLIC_API_URL` | URL da API para o Expo |

## Scripts

```bash
npm run dev          # Desenvolvimento (todos os apps)
npm run build        # Build de produção
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
```
