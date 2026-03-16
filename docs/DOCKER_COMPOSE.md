# Docker Compose Local

## Objetivo

Subir o ambiente local completo do `meureembolso` com:

- PostgreSQL local persistente
- backend Node/Express
- frontend estatico servido por Nginx

A stack padrao do projeto agora fica em `infra/docker-compose.yml`.

## Arquivos usados

- `infra/docker-compose.yml`
- `infra/Dockerfile.api`
- `infra/Dockerfile.frontend`
- `infra/docker/api-entrypoint.sh`

## Subida rapida

```powershell
docker compose -f infra/docker-compose.yml up --build -d
```

Ou:

```powershell
npm run docker:up
```

## Portas

- frontend: `http://localhost:8080`
- backend: `http://localhost:3000`
- banco: `localhost:5432`

## Persistencia do banco

O volume `postgres_data` preserva os dados entre reinicios.

Importante:

- subir a stack nao deve resetar o banco
- `PRISMA_DB_SEED` fica `false` por padrao
- o seed destrutivo esta bloqueado sem habilitacao explicita

## Comandos uteis

```powershell
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml logs -f backend
docker compose -f infra/docker-compose.yml down
```

## Quando usar `infra/docker-stack.yml`

`infra/docker-stack.yml` continua existindo apenas para deploy com imagens publicadas e Traefik/rede externa.