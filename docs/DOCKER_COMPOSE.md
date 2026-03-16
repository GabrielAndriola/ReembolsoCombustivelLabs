# Docker Compose Local

## Objetivo

Subir o ambiente local completo do `meureembolso` com:

- PostgreSQL local persistente
- backend Node/Express
- frontend estatico servido por Nginx

A stack padrao do projeto agora e somente `docker-compose.yml`.

## Arquivos usados

- `docker-compose.yml`
- `Dockerfile.api`
- `Dockerfile.frontend`
- `docker/api-entrypoint.sh`

## Subida rapida

```powershell
docker compose up --build -d
```

Ou:

```powershell
npm run docker:up
```

## Portas

- frontend: `http://localhost:8080`
- backend: `http://localhost:3000`
- banco: `localhost:5432`

## Variaveis de ambiente locais

O backend fora do Docker usa o `.env` padrao:

```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/reembolso_combustivel?schema=public"
DIRECT_URL="postgresql://postgres:12345678@localhost:5432/reembolso_combustivel?schema=public"
JWT_SECRET="changeme"
PORT="3001"
CORS_ORIGIN="http://localhost:5173,http://localhost:8080"
VITE_API_BASE_URL=""
```

No Compose, a stack usa defaults internos e pode ser sobrescrita por variaveis `DOCKER_*` se necessario:

- `DOCKER_DATABASE_URL`
- `DOCKER_DIRECT_URL`
- `DOCKER_JWT_SECRET`
- `DOCKER_CORS_ORIGIN`
- `DOCKER_PRISMA_DB_PUSH`
- `DOCKER_PRISMA_DB_SEED`
- `DOCKER_PRISMA_SEED_MODE`
- `DOCKER_VITE_API_BASE_URL`

## Persistencia do banco

O volume `postgres_data` preserva os dados entre reinicios.

Importante:

- subir a stack nao deve resetar o banco
- `PRISMA_DB_SEED` fica `false` por padrao
- o seed destrutivo esta bloqueado sem habilitacao explicita

## Comandos uteis

```powershell
docker compose ps
docker compose logs -f backend
docker compose down
```

## Quando usar `docker-stack.yml`

`docker-stack.yml` continua existindo apenas para deploy com imagens publicadas e Traefik/rede externa.

Ele nao faz parte do fluxo local diario.
