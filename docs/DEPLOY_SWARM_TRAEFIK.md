# Deploy com Swarm, Traefik e Portainer

## Objetivo

Subir o projeto no padrao definido pela empresa:

- frontend em imagem Docker
- backend em imagem Docker
- PostgreSQL em container Docker
- Traefik como proxy reverso
- Portainer gerenciando a stack
- Cloudflare apenas apontando o DNS
- banco dentro da propria stack

## Desenho final

Fluxo:

```text
Usuario -> Cloudflare DNS -> Traefik -> frontend
Frontend -> /api -> nginx no frontend -> backend
Backend -> PostgreSQL
```

Nesse modelo:

- o frontend responde no dominio `meureembolso.crisdulabs.com.br`
- o backend nao fica exposto diretamente por dominio publico
- o frontend faz proxy de `/api` para o servico `backend` na rede Docker
- por isso o frontend buildado pode continuar com `VITE_API_BASE_URL=""`

## Arquivos usados

- `Dockerfile.api`
- `Dockerfile.frontend`
- `docker/nginx/frontend.conf`
- `docker-stack.yml`

## Imagens Docker

Registry informado pela empresa:

```text
docker.crisdulabs.com.br
```

Imagens definidas:

```text
docker.crisdulabs.com.br/meureembolso/backend:latest
docker.crisdulabs.com.br/meureembolso/frontend:latest
```

## Dominio publicado

Dominio informado:

```text
meureembolso.crisdulabs.com.br
```

## O que o `docker-stack.yml` faz

### db

- sobe PostgreSQL em `postgres:16-alpine`
- persiste dados no volume `postgres_data`
- fica somente na rede interna `rede_company`

### backend

- sobe a API Node/Express
- usa o serviço `db` da stack
- fica somente na rede interna `rede_company`

### frontend

- serve o build do Vite via Nginx
- recebe o dominio publico pelo Traefik
- encaminha `/api` internamente para `http://backend:3001`

## Variaveis para configurar no Portainer

Na stack, configure:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`
- `PRISMA_DB_PUSH`
- `PRISMA_DB_SEED`
- `PRISMA_SEED_MODE`

Exemplo:

```env
POSTGRES_DB=reembolso_combustivel
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345678
DATABASE_URL=postgresql://postgres:12345678@db:5432/reembolso_combustivel?schema=public
DIRECT_URL=postgresql://postgres:12345678@db:5432/reembolso_combustivel?schema=public
JWT_SECRET=defina-um-segredo-forte
PORT=3001
CORS_ORIGIN=https://meureembolso.crisdulabs.com.br
PRISMA_DB_PUSH=true
PRISMA_DB_SEED=true
PRISMA_SEED_MODE=minimal
```

Observacao:

- `DATABASE_URL` e `DIRECT_URL` passam a apontar para `db:5432`
- use a mesma senha de `POSTGRES_PASSWORD`
- se quiser, posso depois simplificar a stack para eliminar a duplicacao manual dessas URLs
- no primeiro deploy, use `PRISMA_DB_PUSH=true` e `PRISMA_DB_SEED=true`
- no primeiro deploy de producao, use `PRISMA_SEED_MODE=minimal`
- depois do banco inicializado, volte ambas para `false`

Como o frontend e o backend ficam sob o mesmo dominio final, `CORS_ORIGIN` pode ser apenas:

```env
CORS_ORIGIN=https://meureembolso.crisdulabs.com.br
```

## Build das imagens

### Backend

```bash
docker build -f Dockerfile.api -t docker.crisdulabs.com.br/meureembolso/backend:latest .
docker push docker.crisdulabs.com.br/meureembolso/backend:latest
```

### Frontend

Como o frontend vai usar o mesmo dominio e proxy de `/api`, mantenha `VITE_API_BASE_URL` vazio:

```bash
docker build -f Dockerfile.frontend -t docker.crisdulabs.com.br/meureembolso/frontend:latest .
docker push docker.crisdulabs.com.br/meureembolso/frontend:latest
```

Se no futuro quiser buildar o frontend apontando para outra API publica, o `Dockerfile.frontend` aceita:

```bash
docker build -f Dockerfile.frontend --build-arg VITE_API_BASE_URL=https://api.seudominio.com -t docker.crisdulabs.com.br/meureembolso/frontend:latest .
```

## Como subir no Portainer

1. abra `Stacks`
2. crie uma stack nova ou atualize a existente
3. use `meureembolso` como nome da stack
4. use o conteudo de `docker-stack.yml`
5. cadastre as variaveis da stack
6. faça o deploy

## Como o dominio funciona

O Traefik publica:

```text
https://meureembolso.crisdulabs.com.br
```

O roteamento configurado no `docker-stack.yml` envia esse host para o servico:

- `frontend`

O Nginx do frontend:

- serve os arquivos do React/Vite
- envia `/api/...` para `backend:3001`

## Cloudflare

Neste desenho, a Cloudflare nao hospeda mais o frontend via Pages.

Ela fica apenas no DNS apontando o dominio para a infraestrutura da empresa.

Consequencias:

- nao precisa configurar `VITE_API_BASE_URL` no painel da Cloudflare Pages
- nao precisa publicar o frontend no Pages
- o frontend passa a ser entregue pelo container `frontend`

## Validacao apos deploy

Site:

```text
https://meureembolso.crisdulabs.com.br
```

Healthcheck pela rota publica:

```text
https://meureembolso.crisdulabs.com.br/api/health
```

Resposta esperada:

```json
{"status":"ok"}
```

## Schema do banco

Como o banco agora esta dentro da stack, o caminho esperado e:

```bash
npm run db:push
```

Ou, se o time preferir executar dentro do container:

```bash
docker exec -it CONTAINER_BACKEND npm run db:push
```

O `DIRECT_URL` agora usa o mesmo host interno `db`, entao essa operacao fica muito mais previsivel do que no Supabase externo.

## Seed inicial

Se quiser que o banco ja suba com os usuarios de exemplo, incluindo o supervisor `willian@crisdu.com.br`, use:

```env
PRISMA_DB_SEED=true
PRISMA_SEED_MODE=minimal
```

O seed atual cria:

- `admin@crisdu.com.br`
- `willian@crisdu.com.br`
- senha inicial `12345678`

Se quiser popular tambem os usuarios de exemplo de homologacao, use:

```env
PRISMA_SEED_MODE=full
```

Nesse modo ele tambem cria:

- `maria.santos@crisdu.com.br`
- `joao.oliveira@crisdu.com.br`
- `ana.costa@crisdu.com.br`

Atencao:

- o seed atual apaga e recria os dados das tabelas da aplicacao
- por isso ele deve ficar `true` apenas no primeiro deploy ou em ambientes descartaveis
- depois do banco populado, volte para:

```env
PRISMA_DB_SEED=false
```

## Resumo operacional

1. buildar imagem do backend
2. enviar imagem do backend para `docker.crisdulabs.com.br`
3. buildar imagem do frontend
4. enviar imagem do frontend para `docker.crisdulabs.com.br`
5. configurar Postgres e variaveis no Portainer
6. subir `docker-stack.yml`
7. deixar `PRISMA_DB_PUSH=true` e `PRISMA_DB_SEED=true` no primeiro deploy
8. depois voltar ambas para `false`
9. apontar o DNS do dominio para a infra da empresa
