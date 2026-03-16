# Deploy do Backend em Linux

## Objetivo

Subir somente a API do `Reembolso Combustivel Labs` em um servidor Linux interno.

Este documento e para o backend apenas.

Use este fluxo quando:

- o frontend vai ficar em outro servidor
- o frontend vai ficar em Cloudflare Pages
- ou voce quer primeiro publicar so a API

## O que o backend deste projeto e

A API atual e:

- Node.js
- Express
- Prisma
- TypeScript executado com `tsx`

Ela sobe a partir de:

- `backend/server/index.ts`

As rotas ficam em:

- `backend/api/`

As regras de negocio ficam em:

- `backend/services/`
- `backend/repositories/`

## O que foi ajustado no projeto para isso

Foi adicionado o script:

```bash
npm run start:api
```

Esse e o comando recomendado para subir a API em producao neste projeto.

## Pre-requisitos

- Ubuntu 22.04 LTS ou similar
- Node.js 20+
- npm 10+
- acesso ao Supabase/PostgreSQL

Validacao:

```bash
node -v
npm -v
```

## 1. Criar pasta da aplicacao

```bash
sudo useradd --system --create-home --shell /bin/bash labsapp
sudo mkdir -p /opt/reembolso-combustivel-labs
sudo chown -R labsapp:labsapp /opt/reembolso-combustivel-labs
```

Copie o repositorio para:

```text
/opt/reembolso-combustivel-labs
```

## 2. Configurar `.env`

Crie:

```text
/opt/reembolso-combustivel-labs/.env
```

Conteudo base:

```env
DATABASE_URL="postgresql://postgres.anlywqfolgtupofelvou:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.anlywqfolgtupofelvou.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="defina-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="http://servidor-frontend-interno,https://app.seudominio.interno"
```

Se o frontend ainda nao estiver publicado, voce pode deixar temporariamente:

```env
CORS_ORIGIN="http://localhost:5173"
```

## 3. Instalar dependencias

```bash
cd /opt/reembolso-combustivel-labs
npm install
npm run db:generate
```

Se precisar sincronizar o schema:

```bash
npm run db:push
```

Se quiser popular a base:

```bash
npm run db:seed
```

## 4. Testar a API manualmente

Antes de criar servico:

```bash
cd /opt/reembolso-combustivel-labs
npm run start:api
```

Em outro terminal:

```bash
curl http://127.0.0.1:3001/api/health
```

Resposta esperada:

```json
{"status":"ok"}
```

## 5. Criar servico `systemd`

Crie:

```text
/etc/systemd/system/reembolso-combustivel-labs-api.service
```

Conteudo:

```ini
[Unit]
Description=Reembolso Combustivel Labs API
After=network.target

[Service]
Type=simple
User=labsapp
WorkingDirectory=/opt/reembolso-combustivel-labs
EnvironmentFile=/opt/reembolso-combustivel-labs/.env
ExecStart=/usr/bin/npm run start:api
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Ative:

```bash
sudo systemctl daemon-reload
sudo systemctl enable reembolso-combustivel-labs-api
sudo systemctl start reembolso-combustivel-labs-api
```

## 6. Validar o servico

```bash
sudo systemctl status reembolso-combustivel-labs-api
journalctl -u reembolso-combustivel-labs-api -n 100 --no-pager
curl http://127.0.0.1:3001/api/health
```

## 7. Expor a API via Nginx

Se quiser publicar a API no mesmo Linux com Nginx:

Crie:

```text
/etc/nginx/sites-available/reembolso-combustivel-labs-api
```

Conteudo:

```nginx
server {
    listen 80;
    server_name api.seudominio.interno;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/reembolso-combustivel-labs-api /etc/nginx/sites-enabled/reembolso-combustivel-labs-api
sudo nginx -t
sudo systemctl reload nginx
```

Depois disso, a API deve responder em algo como:

```text
http://api.seudominio.interno/api/health
```

## 8. Atualizacao de versao

```bash
cd /opt/reembolso-combustivel-labs
npm install
npm run db:generate
sudo systemctl restart reembolso-combustivel-labs-api
```

Se houver mudanca de schema:

```bash
npm run db:push
```

## O que voce precisa alterar no projeto

Para subir o backend Linux com o codigo atual, o minimo necessario e:

- configurar o `.env`
- instalar dependencias
- gerar Prisma Client
- criar o servico `systemd`

No codigo, a alteracao recomendada ja foi feita:

- script `npm run start:api` no `package.json`

Entao, para o cenario atual, voce nao precisa refatorar backend nem separar repositorios.

## O que eu recomendo mudar depois

Para deixar a API mais pronta para producao no futuro:

1. compilar o backend para JavaScript antes de publicar
2. criar um script `start` padrao de producao
3. adicionar logs estruturados
4. adicionar reverse proxy com HTTPS interno
5. reduzir o bundle do frontend separadamente

## Relacao com o frontend

Se o frontend estiver em outro lugar, ajuste:

```env
CORS_ORIGIN="https://frontend.seudominio.interno"
```

Se houver mais de uma origem:

```env
CORS_ORIGIN="https://frontend1.interno,https://frontend2.interno"
```

## Documentos relacionados

- `docs/PROJECT_OVERVIEW.md`
- `docs/DEPLOY_LINUX.md`
- `docs/CLOUDFLARE_DEPLOY.md`


