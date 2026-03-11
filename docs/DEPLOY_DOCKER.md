# Deploy com Docker

## Objetivo

Subir a API do projeto em um servidor da empresa usando Docker e `docker compose`, mantendo o banco no Supabase externo.

Este documento e para o ambiente de servidor.

Use este fluxo quando:

- o servidor da empresa ja tiver Docker instalado
- voce quiser publicar somente a API
- o banco continuar no Supabase

## O que sobe no servidor

Neste modelo sobe apenas:

- container `api`

O banco nao sobe no `compose`:

- PostgreSQL fica no Supabase

## Arquivos usados

- `docker-compose.yml`
- `Dockerfile.api`
- `docker/api-entrypoint.sh`
- `.env.docker`

## Pre-requisitos

- Docker instalado no servidor
- Docker Compose habilitado
- acesso ao projeto Supabase
- portas liberadas para a API publicada

Validacao:

```bash
docker --version
docker compose version
```

## 1. Copiar o projeto para o servidor

Exemplo:

```bash
mkdir -p /opt/reembolso-combustivel-labs
cd /opt/reembolso-combustivel-labs
```

Depois copie o repositorio para essa pasta.

## 2. Criar o `.env.docker`

Na raiz do projeto no servidor:

```bash
cp .env.docker.example .env.docker
```

Preencha com os dados reais do ambiente.

Exemplo:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="defina-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="https://reembolsocombustivellabs.pages.dev,https://app.seudominio.com"
VITE_API_BASE_URL=""
PRISMA_DB_PUSH="false"
```

Regras:

- `DATABASE_URL`: use o pooler do Supabase
- `DIRECT_URL`: use a conexao direta do Supabase
- `JWT_SECRET`: troque por um segredo forte
- `CORS_ORIGIN`: use a URL real do frontend publicado no Cloudflare ou no dominio final

Se houver mais de uma origem:

```env
CORS_ORIGIN="https://frontend1.interno,https://frontend2.interno"
```

## 2.1 Configurar o frontend no Cloudflare

No projeto do frontend no Cloudflare Pages, defina a variavel de ambiente:

```env
VITE_API_BASE_URL=https://api.seudominio.com
```

Essa deve ser a URL publica da API publicada no Docker da empresa.

Nao use `localhost` no frontend publicado.

## 3. Subir a API

Na raiz do projeto:

```bash
docker compose up --build -d
```

Esse e o comando principal de deploy.

## 4. Validar a subida

Ver status:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f api
```

Healthcheck local:

```bash
curl http://127.0.0.1:3001/api/health
```

Resposta esperada:

```json
{"status":"ok"}
```

## 5. Aplicar schema no banco

Recomendacao inicial:

rode `db:push` fora do container, na maquina host.

```bash
npm install
npm run db:push
```

Motivo:

- no ambiente local testado, a API no container funcionou com o pooler do Supabase
- mas a `DIRECT_URL` nao resolveu corretamente dentro do container
- por isso `docker compose exec api npm run db:push` pode falhar em alguns ambientes

Se no servidor da empresa o container resolver a `DIRECT_URL`, voce pode testar:

```bash
docker compose exec api npm run db:push
```

## 6. Popular dados de exemplo

Somente se esse ambiente for de homologacao ou teste:

```bash
docker compose exec api npm run db:seed
```

Atencao:

- o seed atual limpa e recria os dados das tabelas do sistema
- nao rode isso em producao com dados reais sem revisar antes

## 7. Atualizacao de versao

Quando houver novo codigo:

```bash
docker compose up --build -d
```

Se houver alteracao de schema:

```bash
npm run db:push
```

## 8. Operacao do dia a dia

Subir ou atualizar:

```bash
docker compose up --build -d
```

Ver status:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f api
```

Reiniciar:

```bash
docker compose restart api
```

Parar:

```bash
docker compose down
```

## 9. Publicar atras de proxy reverso

Se a API nao for exposta diretamente, publique via Nginx ou proxy interno.

Exemplo de destino interno:

```text
http://127.0.0.1:3001
```

Exemplo de healthcheck publicado:

```text
https://api.interno.empresa.com/api/health
```

## Fluxo recomendado no servidor

Para primeiro deploy:

```bash
cp .env.docker.example .env.docker
docker compose up --build -d
npm install
npm run db:push
curl http://127.0.0.1:3001/api/health
```

Para atualizacao:

```bash
docker compose up --build -d
```

## Problemas comuns

### `docker compose up` sobe mas a API falha ao consultar banco

Checklist:

- confirme que `DATABASE_URL` aponta para o pooler do Supabase
- confirme que a senha foi colocada corretamente
- confirme encode URL se houver caractere especial
- veja os logs com `docker compose logs -f api`

### `db:push` falha dentro do container

Acao recomendada:

```bash
npm run db:push
```

Rode esse comando fora do container.

### CORS bloqueando frontend

Checklist:

- revise `CORS_ORIGIN` no `.env.docker`
- confirme que a origem do frontend esta exata
- se houver mais de uma origem, separe por virgula

## Documentos relacionados

- `docs/DOCKER_COMPOSE.md`
- `docs/DEPLOY_BACKEND_LINUX.md`
- `README.md`
