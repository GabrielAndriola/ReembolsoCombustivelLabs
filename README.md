# Reembolso Combustivel Labs

## Documentacao

- Visao geral do projeto: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- Setup local: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- Docker local: [docs/DOCKER_COMPOSE.md](docs/DOCKER_COMPOSE.md)
- Deploy com imagens Docker: [docs/DEPLOY_DOCKER.md](docs/DEPLOY_DOCKER.md)
- Deploy com Swarm e Traefik: [docs/DEPLOY_SWARM_TRAEFIK.md](docs/DEPLOY_SWARM_TRAEFIK.md)

Sistema interno para controle de presencas presenciais e calculo de reembolso de combustivel por quilometragem.

## Arquitetura atual

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: API Node/Express no mesmo repositorio
- Banco local padrao: PostgreSQL em Docker
- ORM e validacao: Prisma + Zod
- Auth: JWT

## Estrutura principal

- `frontend/`: aplicacao frontend
- `frontend/src/`: codigo React/Vite
- `backend/`: aplicacao backend
- `backend/api/`: rotas HTTP
- `backend/services/`: regras de negocio
- `backend/repositories/`: acesso a dados com Prisma
- `backend/middleware/`: autenticacao e tratamento de erros
- `backend/lib/`: cliente Prisma, env e utilitarios base
- `backend/utils/`: JWT, senha, datas e helpers
- `backend/prisma/`: schema e seed
- `docker-compose.yml`: stack local completa
- `docker-stack.yml`: deploy com imagens publicadas

## Setup local rapido

1. Instale dependencias:

```bash
npm install
```

2. Revise o `.env`:

```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/reembolso_combustivel?schema=public"
DIRECT_URL="postgresql://postgres:12345678@localhost:5432/reembolso_combustivel?schema=public"
JWT_SECRET="changeme"
PORT="3001"
CORS_ORIGIN="http://localhost:5173,http://localhost:8080"
VITE_API_BASE_URL=""
```

3. Suba a stack local completa:

```bash
docker compose up --build -d
```

4. Se quiser rodar frontend e backend fora do Docker usando o mesmo banco local:

```bash
npm run dev
```

Endpoints locais:

- frontend Docker: `http://localhost:8080`
- frontend Vite: `http://localhost:5173`
- backend: `http://localhost:3000` no Docker ou `http://localhost:3001` fora do Docker
- banco PostgreSQL: `localhost:5432`

## Padrao atual de Docker

Hoje existem dois fluxos reais:

- `docker-compose.yml`: ambiente local completo, com Postgres, backend e frontend
- `docker-stack.yml`: deploy com imagens publicadas e Traefik/rede externa

## Observacoes importantes

- o banco local em Docker e persistente via volume `postgres_data`
- a stack nao faz seed destrutivo automaticamente
- `docker compose up --build -d` nao deve resetar os dados
- alteracoes de schema devem continuar sendo feitas no banco existente
