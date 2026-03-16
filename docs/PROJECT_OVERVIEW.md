# Resumo do Projeto

## Nome

`meureembolso`

## O que este sistema faz

Sistema interno para controle de presencas presenciais e calculo de reembolso de combustivel por quilometragem.

## Stack do projeto

### Frontend

- React
- Vite
- TypeScript
- Tailwind
- codigo em `frontend/`

### Backend

- Node.js
- Express
- TypeScript executado com `tsx`
- Prisma
- codigo em `backend/`

### Banco de dados

- PostgreSQL
- ambiente local padrao em Docker
- persistencia via volume Docker

Schema e seed ficam em:

- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`

## Como o projeto roda hoje

### Em desenvolvimento

1. stack completa em Docker com `docker compose -f infra/docker-compose.yml up --build -d`
2. frontend/backend fora do Docker com `npm run dev`, usando o mesmo Postgres local em `localhost:5432`

### Em deploy

- `infra/docker-compose.yml`: fluxo local
- `infra/docker-stack.yml`: deploy com imagens publicadas e rede externa/Traefik

## Estrutura principal

- `frontend/`: app frontend
- `frontend/src/`: frontend React/Vite
- `frontend/public/`: assets publicos do frontend
- `frontend/vite.config.ts`: config do frontend
- `backend/server/`: bootstrap da API
- `backend/api/`: rotas HTTP
- `backend/services/`: regras de negocio
- `backend/repositories/`: acesso a dados
- `backend/middleware/`: auth e tratamento de erro
- `backend/lib/`: env, Prisma e utilitarios base
- `backend/utils/`: helpers gerais
- `backend/prisma/`: schema e seed
- `infra/`: arquivos Docker e operacionais
- `docs/`: documentacao operacional