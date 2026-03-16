# Setup Local

## Estrutura atual

- Frontend React/Vite em `frontend/`
- API Node/Express com Prisma em `backend/`
- Infraestrutura local em `infra/`
- Banco PostgreSQL local em Docker

## Fluxos disponiveis

### 1. Stack completa em Docker

```powershell
docker compose -f infra/docker-compose.yml up --build -d
```

Endpoints:

- frontend: `http://localhost:8080`
- backend: `http://localhost:3000`
- banco: `localhost:5432`

### 2. Frontend e backend fora do Docker usando o mesmo banco

Suba primeiro o banco com Docker e depois rode:

```powershell
npm run dev
```

Endpoints:

- frontend Vite: `http://localhost:5173`
- backend: `http://localhost:3001`

## Arquivos principais

- `frontend/src/app/lib/api.ts`
- `frontend/vite.config.ts`
- `backend/server/index.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `infra/docker-compose.yml`

## Comandos uteis

```powershell
npm run db:generate
npm run db:push
npm run db:seed
npm run docker:up
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```

## Observacao

O projeto foi reorganizado fisicamente em `frontend/`, `backend/` e `infra/`, mas continua usando um unico `package.json` na raiz para manter o fluxo simples.