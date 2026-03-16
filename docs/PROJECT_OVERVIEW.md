# Resumo do Projeto

## Nome

`meureembolso`

## O que este sistema faz

Sistema interno para controle de presencas presenciais e calculo de reembolso de combustivel por quilometragem.

Hoje ele cobre principalmente:

- autenticacao de usuarios
- cadastro e edicao de funcionarios
- definicao de tarifa `R$/km`
- registro de presencas
- aprovacao de solicitacoes por supervisor/admin
- relatorios gerenciais

## Stack do projeto

### Frontend

- React
- Vite
- TypeScript
- Tailwind
- codigo em `frontend/src/`

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

Voce pode usar um destes fluxos:

1. stack completa em Docker com `docker compose up --build -d`
2. frontend/backend fora do Docker com `npm run dev`, usando o mesmo Postgres local em `localhost:5432`

### Em deploy

Existem dois artefatos principais:

- frontend estatico
- backend Node/Express

Operacionalmente hoje existem dois arquivos Docker relevantes:

- `docker-compose.yml`: ambiente local completo
- `docker-stack.yml`: deploy com imagens publicadas e rede externa/Traefik

## Estrutura principal

- `frontend/`: app frontend
- `frontend/src/`: frontend React/Vite
- `frontend/public/`: assets publicos do frontend
- `backend/server/`: bootstrap da API
- `backend/api/`: rotas HTTP
- `backend/services/`: regras de negocio
- `backend/repositories/`: acesso a dados
- `backend/middleware/`: auth e tratamento de erro
- `backend/lib/`: env, Prisma e utilitarios base
- `backend/utils/`: helpers gerais
- `backend/prisma/`: schema e seed
- `docs/`: documentacao operacional

## Resumo rapido para outra pessoa

`E um sistema web interno de reembolso de combustivel, com frontend React/Vite em frontend/ e backend Node/Express em backend/, usando PostgreSQL local em Docker no ambiente de desenvolvimento.`

## Documentos relacionados

- `docs/LOCAL_SETUP.md`
- `docs/DOCKER_COMPOSE.md`
- `docs/DEPLOY_WINDOWS.md`
- `docs/DEPLOY_LINUX.md`
- `README.md`
