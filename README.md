# Reembolso Combustivel Labs

## Documentacao

- Visao geral do projeto: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- Setup local: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- Docker local: [docs/DOCKER_COMPOSE.md](docs/DOCKER_COMPOSE.md)
- Deploy com imagens Docker: [docs/DEPLOY_DOCKER.md](docs/DEPLOY_DOCKER.md)
- Deploy com Swarm e Traefik: [docs/DEPLOY_SWARM_TRAEFIK.md](docs/DEPLOY_SWARM_TRAEFIK.md)

Sistema interno para controle de presencas presenciais e calculo de reembolso de combustivel por quilometragem.

## Estrutura principal

- `frontend/`: aplicacao frontend
- `frontend/src/`: codigo React/Vite
- `frontend/public/`: assets publicos
- `backend/`: aplicacao backend
- `backend/api/`: rotas HTTP
- `backend/services/`: regras de negocio
- `backend/repositories/`: acesso a dados com Prisma
- `backend/middleware/`: autenticacao e tratamento de erros
- `backend/lib/`: cliente Prisma, env e utilitarios base
- `backend/utils/`: JWT, senha, datas e helpers
- `backend/prisma/`: schema e seed
- `infra/`: Dockerfiles, compose e arquivos de operacao
- `docs/`: documentacao

## Setup local rapido

```bash
npm install
docker compose -f infra/docker-compose.yml up --build -d
```

Se quiser rodar frontend e backend fora do Docker usando o mesmo banco local:

```bash
npm run dev
```

## Endpoints locais

- frontend Docker: `http://localhost:8080`
- frontend Vite: `http://localhost:5173`
- backend Docker: `http://localhost:3000`
- backend fora do Docker: `http://localhost:3001`
- banco PostgreSQL: `localhost:5432`

## Scripts principais

- `npm run build`
- `npm run dev`
- `npm run db:generate`
- `npm run db:push`
- `npm run docker:up`
- `npm run docker:down`

## Padrao atual

- `infra/docker-compose.yml`: ambiente local completo
- `infra/docker-stack.yml`: deploy com imagens publicadas e rede externa

O banco local em Docker e persistente e nao deve ser resetado automaticamente ao subir a stack.