# Deploy Interno em Linux

## Objetivo

Subir o `Reembolso Combustivel Labs` em um servidor Linux interno da empresa, deixando:

- frontend estatico servido por Nginx
- API Node/Express rodando via `systemd`
- banco apontando para Supabase PostgreSQL

Este guia assume:

- Ubuntu 22.04 LTS ou similar
- Node.js 20+
- npm 10+
- Nginx
- acesso ao Supabase

## Arquitetura recomendada

- frontend: Nginx servindo `dist/`
- API: `node` + `tsx` em servico `systemd`
- proxy reverso:
  - `/` -> frontend
  - `/api` -> API local em `127.0.0.1:3001`

## 1. Preparar o servidor

Instale dependencias basicas:

```bash
sudo apt update
sudo apt install -y nginx curl build-essential
```

Instale Node.js 20+.

Validacao:

```bash
node -v
npm -v
```

## 2. Criar usuario e pasta da aplicacao

```bash
sudo useradd --system --create-home --shell /bin/bash labsapp
sudo mkdir -p /opt/reembolso-combustivel-labs
sudo chown -R labsapp:labsapp /opt/reembolso-combustivel-labs
```

Copie o projeto para:

```text
/opt/reembolso-combustivel-labs
```

## 3. Configurar `.env`

Crie `/opt/reembolso-combustivel-labs/.env`:

```env
DATABASE_URL="postgresql://postgres.anlywqfolgtupofelvou:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.anlywqfolgtupofelvou.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="defina-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="http://servidor-interno"
VITE_API_BASE_URL="/api"
```

Se usar HTTPS interno:

```env
CORS_ORIGIN="https://servidor-interno"
VITE_API_BASE_URL="/api"
```

## 4. Instalar dependencias e gerar build

```bash
cd /opt/reembolso-combustivel-labs
npm install
npm run db:generate
npm run build
```

Se necessario:

```bash
npm run db:push
npm run db:seed
```

## 5. Criar servico `systemd` da API

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
ExecStart=/usr/bin/node /opt/reembolso-combustivel-labs/node_modules/tsx/dist/cli.mjs /opt/reembolso-combustivel-labs/backend/server/index.ts
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

Validar:

```bash
sudo systemctl status reembolso-combustivel-labs-api
curl http://127.0.0.1:3001/api/health
```

## 6. Publicar o frontend no Nginx

Crie a pasta publica:

```bash
sudo mkdir -p /var/www/reembolso-combustivel-labs
sudo cp -r /opt/reembolso-combustivel-labs/dist/* /var/www/reembolso-combustivel-labs/
```

## 7. Configurar Nginx

Crie:

```text
/etc/nginx/sites-available/reembolso-combustivel-labs
```

Conteudo:

```nginx
server {
    listen 80;
    server_name servidor-interno;

    root /var/www/reembolso-combustivel-labs;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/reembolso-combustivel-labs /etc/nginx/sites-enabled/reembolso-combustivel-labs
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Atualizacao de versao

```bash
cd /opt/reembolso-combustivel-labs
npm install
npm run db:generate
npm run build
sudo rm -rf /var/www/reembolso-combustivel-labs/*
sudo cp -r dist/* /var/www/reembolso-combustivel-labs/
sudo systemctl restart reembolso-combustivel-labs-api
sudo systemctl reload nginx
```

Se houver mudanca de schema:

```bash
npm run db:push
```

## 9. Validacao

API local:

```bash
curl http://127.0.0.1:3001/api/health
```

Aplicacao:

```text
http://servidor-interno
```

Credenciais:

- `admin@crisdu.com.br`
- `willian@crisdu.com.br`
- `gabriel.andriola@crisdu.com.br`
- senha: `12345678`

## Problemas comuns

### Nginx retorna 502 em `/api`

Verifique:

```bash
sudo systemctl status reembolso-combustivel-labs-api
journalctl -u reembolso-combustivel-labs-api -n 100 --no-pager
```

### Rotas do frontend retornam 404

Confirme:

```nginx
try_files $uri $uri/ /index.html;
```

### Erro de CORS

Confirme o valor de:

```env
CORS_ORIGIN
```

### `db push` falha, mas o app conecta

Confirme que:

- `DATABASE_URL` usa o pooler
- `DIRECT_URL` usa a conexao direta



