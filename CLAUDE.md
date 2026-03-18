# Meureembolso — CLAUDE.md (Raiz)

## Visão Geral

Sistema interno de controle de presença e reembolso de combustível por quilometragem. Arquitetura de monorepo com frontend React, backend Express e infraestrutura Docker.

## Estrutura do Monorepo

```
meureembolso/
├── backend/        # API Express + Prisma + PostgreSQL
├── frontend/       # React + Vite + TailwindCSS
├── infra/          # Docker, Nginx, entrypoints
├── docs/           # Documentação operacional
└── dist/           # Build do frontend (gerado)
```

## Comandos Principais

```bash
# Desenvolvimento local (frontend + backend simultaneamente)
npm run dev

# Apenas frontend
npm run dev:web

# Apenas backend
npm run dev:api

# Build de produção (frontend → /dist)
npm run build

# Docker local completo
npm run docker:up
npm run docker:down
npm run docker:logs

# Banco de dados
npm run db:generate   # gera Prisma client
npm run db:push       # sincroniza schema com o banco
npm run db:seed       # popula dados de teste
```

## Stack Técnico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite | 18.3.1 / 6.3.5 |
| Estilização | TailwindCSS | 4.1.12 |
| UI Components | Radix UI | 1.2.x |
| Roteamento | React Router | 7.13 |
| Formulários | React Hook Form + Zod | 7.55 / 4.3.x |
| Charts | Recharts | 2.15.2 |
| Backend | Express | 5.2.1 |
| ORM | Prisma | 6.17.1 |
| Banco | PostgreSQL | 16 |
| Autenticação | JWT (7 dias) | jsonwebtoken 9.x |
| Containerização | Docker + Nginx | - |
| Linguagem | TypeScript | ES2022 |

## Variáveis de Ambiente

Copie `.env.example` para `.env` na raiz e preencha:

```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/reembolso_combustivel?schema=public"
DIRECT_URL="postgresql://postgres:12345678@localhost:5432/reembolso_combustivel?schema=public"
JWT_SECRET="troque-por-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="http://localhost:5173,http://localhost:8080"
VITE_API_BASE_URL=""
```

## Portas Locais

| Serviço | Modo dev local | Modo Docker |
|---------|---------------|-------------|
| Frontend | http://localhost:5173 | http://localhost:8080 |
| Backend | http://localhost:3001 | http://localhost:3000 |
| PostgreSQL | localhost:5432 | localhost:5432 |

## Papéis de Usuário (Roles)

- `ADMIN` — acesso total ao sistema
- `SUPERVISOR` — gerencia funcionários, aprova registros, acessa relatórios
- `EMPLOYEE` — registra presenças e consulta histórico próprio

## Seed de Dados

O seed cria dados de teste. Requer a flag de segurança:

```bash
ALLOW_DESTRUCTIVE_SEED=true npm run db:seed
```

Cria: 1 empresa, 1 admin, 1 supervisor, 3 funcionários com registros de presença.

## Padrões Gerais

- Todo o código usa TypeScript — sem `any` implícito
- Validação de entrada com Zod tanto no backend quanto nos formulários do frontend
- Erros de negócio lançados como `AppError` (backend) com código HTTP explícito
- IDs gerados com CUID (`@default(cuid())`) no Prisma
- Datas sempre em UTC no banco; formatação visual no frontend com `date-fns`
- Valores monetários e distâncias em `Decimal(10, 2)` no banco; serializados como `number` nas respostas da API
