# Plataforma Ápice by Black Premium

> **Eleve. Estruture. Lidere.**

SaaS multi-clínica para gestão de experiência do paciente em cirurgia plástica premium.

**Cliente piloto:** Clínica Bervian & Larsen — Porto Alegre/RS

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | Node.js + Express + TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Cache | Redis (Upstash) |
| IA | Anthropic API (claude-sonnet-4-6) |
| Storage | AWS S3 |
| Web Admin | Next.js 14 + Tailwind CSS |
| Mobile | React Native + Expo SDK 51 |
| Monorepo | Turborepo |

---

## Pré-requisitos

- Node.js >= 20
- PostgreSQL (local ou Supabase/Neon)
- Chave da Anthropic API

---

## Instalação

```bash
# 1. Clonar e instalar
git clone <repo>
cd apice-platform
npm install

# 2. Configurar variáveis de ambiente
cp .env.example apps/api/.env
# Editar apps/api/.env com suas credenciais

# 3. Setup do banco de dados
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Rodar em desenvolvimento
npm run dev
```

---

## Credenciais de Demo

| Usuário | E-mail | Senha |
|---------|--------|-------|
| Admin | `admin@bervianlarsen.com.br` | `apice2026` |
| Dr. Bervian | `fabricio@bervianlarsen.com.br` | `apice2026` |
| Paciente (Fernanda) | `fernanda@email.com` | `apice2026` |

---

## Estrutura

```
apice-platform/
├── apps/
│   ├── api/          # Backend (porta 3001)
│   │   ├── src/
│   │   │   ├── routes/       # auth, patient, clinic, admin
│   │   │   ├── services/     # ai.service, jornada.service
│   │   │   └── jobs/         # checklist.cron (automações T-72h/24h/2h)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   ├── web/          # Painel admin Next.js (porta 3000)
│   │   └── app/
│   │       ├── login/
│   │       └── (admin)/
│   │           ├── dashboard/
│   │           ├── pipeline/
│   │           ├── cirurgias/
│   │           ├── pacientes/
│   │           ├── mensagens/
│   │           ├── procedimentos/
│   │           ├── hospitais/
│   │           └── medicos/
│   └── mobile/       # App React Native + Expo
│       └── app/
│           ├── (auth)/login.tsx
│           └── (patient)/
│               ├── index.tsx    # Jornada
│               ├── documentos.tsx
│               ├── videos.tsx
│               ├── chat.tsx
│               └── perfil.tsx
└── packages/
    ├── types/        # Tipos TypeScript compartilhados
    └── utils/        # Utilitários (datas, moeda, etc.)
```

---

## Funcionalidades

### App Mobile (Paciente)
- **Jornada**: 8 etapas clicáveis com progresso visual
- **Documentos**: Termos, receitas e orientações por categoria
- **Vídeos**: Vídeos do procedimento do paciente
- **Chat IA**: 3 camadas — resposta rápida → Anthropic API → fila de aprovação
- **Perfil**: Dados da cirurgia, checklist, contato da clínica

### Painel Admin (Web)
- **Dashboard**: KPIs com variação, gráficos Recharts, próximas cirurgias
- **Pipeline Kanban**: Leads em 4 estágios com movimento entre colunas
- **Procedimentos**: Cadastro completo com propagação automática para pacientes
- **Mensagens**: Fila de aprovação de respostas IA + histórico
- **Hospitais / Médicos / Pacientes / Cirurgias**: CRUD completo

### API Backend
- Autenticação JWT (access 15min + refresh 7 dias)
- Multi-tenant por clinicId
- IA em 3 camadas com análise de sentimento
- Automações cron: T-72h, T-24h, T-2h e D+1 (liberação pós-alta)
- Propagação automática da jornada ao vincular procedimento ao paciente

---

## Variáveis de Ambiente

Ver `.env.example` na raiz do projeto.

---

## Build para Produção

```bash
# Web admin
cd apps/web && npm run build

# API
cd apps/api && npm run build && npm start

# Mobile
cd apps/mobile && npx expo build
```

---

*Plataforma Ápice by Black Premium — Todos os direitos reservados.*
