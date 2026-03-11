# Docker Compose

## Objetivo

Subir o backend do projeto com `docker compose` usando Supabase externo.

Este fluxo sobe:

- API Node/Express em `http://localhost:3001`

O banco continua sendo o Supabase, fora do Docker.

O frontend pode continuar rodando fora do Docker com `npm run dev:web`.

## Arquivos adicionados para este fluxo

- `docker-compose.yml`
- `Dockerfile.api`
- `docker/api-entrypoint.sh`
- `.env.docker.example`

## Pre-requisitos

- Docker Desktop instalado
- Docker Compose habilitado
- acesso ao projeto Supabase

Validacao:

```powershell
docker --version
docker compose version
```

## 1. Criar o arquivo de ambiente do Compose

Na raiz do projeto:

```powershell
Copy-Item .env.docker.example .env.docker
```

## 2. Preencher as variaveis do Supabase

Edite `.env.docker` com as URLs reais do seu projeto.

Modelo recomendado:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="troque-por-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="https://SEU-PROJETO.pages.dev,https://app.seudominio.com"
VITE_API_BASE_URL=""
PRISMA_DB_PUSH="false"
```

Use assim:

- `DATABASE_URL`: pooler do Supabase para a aplicacao
- `DIRECT_URL`: conexao direta do Supabase para `prisma db push`
- `CORS_ORIGIN`: dominio publicado do frontend no Cloudflare
- `VITE_API_BASE_URL`: no backend pode continuar vazio; quem usa essa variavel e o build do frontend

Notas:

- se a senha tiver caracteres especiais, use encode URL
- `PRISMA_DB_PUSH="false"` evita alterar schema automaticamente a cada subida

## 3. Subir a API no Docker

```powershell
docker compose up --build -d
```

Se preferir via script do projeto:

```powershell
npm run docker:up
```

## 4. Aplicar o schema no Supabase

Preferencia recomendada:

rode o schema fora do container, na maquina host, usando o `.env` local.

```powershell
npm run db:push
```

Motivo:

- neste ambiente testado, o container resolveu o host do pooler normalmente
- mas nao resolveu `db.PROJECT_REF.supabase.co`, usado pela `DIRECT_URL`
- por isso a API em Docker funcionou, mas `docker compose exec api npm run db:push` falhou

Se no seu ambiente o container resolver a `DIRECT_URL`, este comando tambem pode funcionar:

```powershell
docker compose exec api npm run db:push
```

Esse comando usa a `DIRECT_URL`.

## 5. Popular a base com dados de exemplo

Se quiser inserir os dados iniciais:

```powershell
docker compose exec api npm run db:seed
```

O seed atual apaga e recria os dados das tabelas usadas pela aplicacao. Rode isso apenas se fizer sentido para esse ambiente.

## 6. Verificar se subiu

Containers:

```powershell
docker compose ps
```

Healthcheck da API:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```

Resposta esperada:

```json
{"status":"ok"}
```

Logs da API:

```powershell
docker compose logs -f api
```

Ou:

```powershell
npm run docker:logs
```

## 7. Rodar o frontend junto com o backend em Compose

Com a API no Docker, o frontend pode continuar fora do container:

```powershell
npm run dev:web
```

Como o Vite ja faz proxy de `/api` para `http://localhost:3001`, o frontend continua funcionando em:

```text
http://localhost:5173
```

## 8. Frontend no Cloudflare

Quando o frontend for publicado no Cloudflare Pages, ele nao deve usar `localhost`.

No deploy do frontend, defina:

```env
VITE_API_BASE_URL=https://api.seudominio.com
```

Exemplos validos:

- `https://api.seudominio.com`
- `https://api.interno.empresa.com`

Nao use:

- `http://localhost:3001`

No backend Docker, configure `CORS_ORIGIN` com o dominio real do frontend:

```env
CORS_ORIGIN="https://SEU-PROJETO.pages.dev,https://app.seudominio.com"
```

## 9. Parar o ambiente

```powershell
docker compose down
```

Ou:

```powershell
npm run docker:down
```

## Fluxo completo mais direto

```powershell
Copy-Item .env.docker.example .env.docker
docker compose up --build -d
npm run db:push
docker compose exec api npm run db:seed
npm run dev:web
```

## Problemas comuns

### API nao sobe e o log mostra erro do Prisma

Checklist:

- confirme que `DATABASE_URL` usa o pooler do Supabase
- confirme que `DIRECT_URL` usa a conexao direta do Supabase
- confirme que a senha foi colocada com encode correto se tiver caracteres especiais
- se `docker compose exec api npm run db:push` falhar, rode `npm run db:push` fora do container

### Porta 3001 ocupada

Ajuste o mapeamento em `docker-compose.yml`.

Exemplo:

```yaml
ports:
  - "3002:3001"
```

Se trocar a porta publicada da API, ajuste tambem o proxy do Vite em `vite.config.ts`.

### Frontend abre mas a API falha

Checklist:

- `docker compose ps` mostra `api` em execucao
- `http://localhost:3001/api/health` responde
- em local, `CORS_ORIGIN` inclui `http://localhost:5173`
- em Cloudflare, `CORS_ORIGIN` inclui o dominio publicado do frontend
- no Cloudflare, `VITE_API_BASE_URL` aponta para a URL publica da API

## Arquivos relevantes

- `docker-compose.yml`
- `Dockerfile.api`
- `docker/api-entrypoint.sh`
- `.env.docker.example`
- `prisma/schema.prisma`
- `prisma/seed.ts`
