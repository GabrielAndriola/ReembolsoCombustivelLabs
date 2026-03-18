# Infra — CLAUDE.md

## Visão Geral

Toda a infraestrutura de containerização e deploy do projeto. Dois modos de operação:

| Modo | Arquivo | Uso |
|------|---------|-----|
| Desenvolvimento local | `docker-compose.yml` | Sobe DB + backend + frontend isolados |
| Produção (Docker Swarm) | `docker-stack.yml` | Deploy com Traefik, SSL, rede externa |

## Estrutura de Pastas

```
infra/
├── Dockerfile.api          # Imagem do backend (Node 20)
├── Dockerfile.frontend     # Imagem do frontend (build Vite → Nginx)
├── docker-compose.yml      # Stack de desenvolvimento local
├── docker-stack.yml        # Stack de produção (Swarm + Traefik)
└── docker/
    ├── api-entrypoint.sh   # Script de inicialização do backend
    └── nginx/
        └── frontend.conf   # Config Nginx: proxy /api + SPA fallback
```

## Dockerfiles

### `Dockerfile.api` — Backend

```
Base: node:20-bookworm-slim
1. Instala openssl + ca-certificates (necessário para Prisma)
2. Copia package.json, backend/, infra/docker/, tsconfig.json
3. npm ci
4. npx prisma generate
5. Expõe porta 3000
6. CMD: ./docker/api-entrypoint.sh
```

**Rebuild necessário quando:** mudar dependências (`package.json`), alterar schema Prisma, alterar `api-entrypoint.sh`.

### `Dockerfile.frontend` — Frontend (multi-stage)

```
Stage 1 (build): node:20-bookworm-slim
  - Copia package.json, frontend/, tsconfig.json
  - npm ci + npm run build → /app/dist
  - ARG VITE_API_BASE_URL (passado em build-time)

Stage 2 (serve): nginx:1.27-alpine
  - Copia frontend.conf → /etc/nginx/conf.d/default.conf
  - Copia /app/dist → /usr/share/nginx/html
  - Expõe porta 80
```

**IMPORTANTE:** `VITE_API_BASE_URL` é baked no bundle em build-time. Para apontar para a API em produção, passar o arg correto ao buildar:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.dominio.com -f infra/Dockerfile.frontend .
```

Em desenvolvimento local (docker-compose) deixar vazio — o Nginx redireciona `/api/*` para o serviço `backend:3000`.

## api-entrypoint.sh

Executado no startup do container backend. Sequência:

1. `npm run db:generate` — sempre gera o Prisma client
2. Se `PRISMA_DB_PUSH=true` → `npm run db:push` (sincroniza schema)
3. Se `PRISMA_DB_SEED=true` → `npm run db:seed` (popula dados)
4. `npm run start:api`

**Flags de ambiente do backend:**

| Variável | Padrão local | Padrão produção | Descrição |
|----------|-------------|-----------------|-----------|
| `PRISMA_DB_PUSH` | `true` | `false` | Sincroniza schema ao subir |
| `PRISMA_DB_SEED` | `false` | `false` | Roda seed ao subir |
| `PRISMA_SEED_MODE` | `full` | `minimal` | Modo do seed |

## Nginx (`frontend.conf`)

```nginx
# Proxy da API: /api/* → backend:3000
location /api/ {
    proxy_pass http://backend:3000;
}

# SPA fallback: qualquer rota → index.html
location / {
    try_files $uri $uri/ /index.html;
}
```

O nome `backend` é o nome do serviço Docker — funciona automaticamente na rede interna Docker.

## docker-compose.yml (Desenvolvimento Local)

```bash
# Subir tudo (com build)
docker compose -f infra/docker-compose.yml up --build -d

# Parar
docker compose -f infra/docker-compose.yml down

# Ver logs do backend
docker compose -f infra/docker-compose.yml logs -f backend

# Portas expostas
# PostgreSQL → localhost:5432
# Backend    → localhost:3000
# Frontend   → localhost:8080
```

**Serviços e ordem de inicialização:** `db` → `backend` → `frontend`

**Volume persistente:** `postgres_data` — os dados do banco **não são apagados** ao fazer `docker compose down`. Para resetar o banco:

```bash
docker compose -f infra/docker-compose.yml down -v   # remove volumes também
```

**Variáveis configuráveis via `.env` na raiz:**

| Variável | Padrão |
|----------|--------|
| `POSTGRES_DB` | `reembolso_combustivel` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `12345678` |
| `DOCKER_DATABASE_URL` | `postgresql://postgres:12345678@db:5432/...` |
| `DOCKER_JWT_SECRET` | `changeme` |
| `DOCKER_CORS_ORIGIN` | `http://localhost:8080,http://localhost:5173` |
| `DOCKER_PRISMA_DB_PUSH` | `true` |
| `DOCKER_PRISMA_DB_SEED` | `false` |
| `DOCKER_VITE_API_BASE_URL` | `` (vazio) |

## docker-stack.yml (Produção — Docker Swarm)

Deploy via Docker Swarm com Traefik como reverse proxy e SSL automático via Let's Encrypt.

```bash
# Deploy no swarm
docker stack deploy -c infra/docker-stack.yml meureembolso

# Remover stack
docker stack rm meureembolso
```

**Imagens de produção:**
- Backend: `docker.crisdulabs.com.br/meureembolso/backend:latest`
- Frontend: `docker.crisdulabs.com.br/meureembolso/frontend:latest`

**Rede:** `rede_company` (external — deve existir no Swarm antes do deploy)

**Traefik labels no frontend:**
- Rota: `meureembolso.crisdulabs.com.br`
- Entrypoint: `websecure` (HTTPS)
- TLS: Let's Encrypt (`letsencryptresolver`)
- Porta interna: 80

**Variáveis de ambiente obrigatórias em produção** (via Docker secrets ou `.env` no servidor):

```env
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
PORT=3000
CORS_ORIGIN=
PRISMA_DB_PUSH=false
PRISMA_DB_SEED=false
PRISMA_SEED_MODE=minimal
```

## Fluxo de Build e Deploy

### Local (dev)
```bash
# Apenas docker-compose — não precisa buildar imagens manualmente
npm run docker:up
```

### Produção
```bash
# 1. Build e push das imagens
docker build -f infra/Dockerfile.api -t docker.crisdulabs.com.br/meureembolso/backend:latest .
docker build -f infra/Dockerfile.frontend \
  --build-arg VITE_API_BASE_URL="" \
  -t docker.crisdulabs.com.br/meureembolso/frontend:latest .

docker push docker.crisdulabs.com.br/meureembolso/backend:latest
docker push docker.crisdulabs.com.br/meureembolso/frontend:latest

# 2. Deploy no Swarm
docker stack deploy -c infra/docker-stack.yml meureembolso
```

## Contexto de Build dos Dockerfiles

Ambos os Dockerfiles usam `..` como contexto (raiz do repo), pois precisam de arquivos de múltiplas pastas:

- `Dockerfile.api` precisa de: `package.json`, `backend/`, `infra/docker/`, `tsconfig.json`
- `Dockerfile.frontend` precisa de: `package.json`, `frontend/`, `tsconfig.json`, `infra/docker/nginx/`

**Nunca rodar** `docker build` de dentro da pasta `infra/` — sempre da raiz:

```bash
# Correto (da raiz do repo)
docker build -f infra/Dockerfile.api .

# Errado
cd infra && docker build -f Dockerfile.api .
```
