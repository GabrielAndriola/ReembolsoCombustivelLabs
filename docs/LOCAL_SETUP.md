# Rodando Localmente

## Visao geral

Este projeto tem duas partes:

- Frontend React/Vite em `src/`
- API Node/Express com Prisma em `server/`, `api/`, `services/`, `repositories/`

Em desenvolvimento local:

- frontend: `http://localhost:5173`
- api: `http://localhost:3001`
- banco: Supabase PostgreSQL

## Pre-requisitos

Instale antes de começar:

- Node.js 20 ou superior
- npm 10 ou superior
- acesso ao projeto Supabase

Comandos para validar:

```powershell
node -v
npm -v
```

## Qual connection string usar

Voce me passou tres strings:

### 1. Direct connection

Use para operacoes de schema do Prisma, especialmente `db push`:

```env
postgresql://postgres:[YOUR-PASSWORD]@db.anlywqfolgtupofelvou.supabase.co:5432/postgres
```

### 2. Pooler

Use para a aplicacao rodando no dia a dia:

```env
postgresql://postgres.anlywqfolgtupofelvou:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### 3. Transaction pooler

Mantenha reservado para cenarios altamente serverless. Neste projeto atual, o caminho mais estavel e:

- `DATABASE_URL` = pooler `:5432`
- `DIRECT_URL` = direct connection `:5432`

## Arquivo `.env`

Copie o exemplo:

```powershell
Copy-Item .env.example .env
```

Edite o arquivo `.env` para ficar assim:

```env
DATABASE_URL="postgresql://postgres.anlywqfolgtupofelvou:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=5"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.anlywqfolgtupofelvou.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="troque-por-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="http://localhost:5173"
VITE_API_BASE_URL=""
```

Notas:

- `DATABASE_URL` fica apontando para o pooler.
- `DIRECT_URL` fica apontando para a conexao direta.
- `VITE_API_BASE_URL=""` em local faz o frontend usar `/api` no mesmo host do Vite, com proxy para `localhost:3001`.

## Instalacao

Na raiz do projeto:

```powershell
npm install
```

## Preparar Prisma

Gerar client:

```powershell
npm run db:generate
```

Aplicar schema no banco:

```powershell
npm run db:push
```

Popular dados iniciais:

```powershell
npm run db:seed
```

## Subir o ambiente local

Subir frontend e backend juntos:

```powershell
npm run dev
```

Esse comando sobe:

- Vite em `http://localhost:5173`
- API Express em `http://localhost:3001`

## Testes manuais recomendados

### 1. Healthcheck da API

Abra no navegador ou rode:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```

Resposta esperada:

```json
{"status":"ok"}
```

### 2. Login pela API

```powershell
$body = @{
  email = "gabriel.andriola@crisdu.com.br"
  password = "12345678"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3001/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### 3. Login pela interface

Acesse:

```text
http://localhost:5173/login
```

Credenciais seed:

- admin: `admin@crisdu.com.br`
- supervisor: `willian@crisdu.com.br`
- employee: `gabriel.andriola@crisdu.com.br`
- senha: `12345678`

## Fluxo completo do zero

Se quiser o passo a passo mais direto possivel:

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Quando precisar recriar os dados

O seed atual limpa tabelas e insere tudo de novo. Para recriar:

```powershell
npm run db:seed
```

## Comandos uteis

Instalar dependencias:

```powershell
npm install
```

Gerar Prisma Client:

```powershell
npm run db:generate
```

Sincronizar schema com banco:

```powershell
npm run db:push
```

Executar seed:

```powershell
npm run db:seed
```

Subir tudo em desenvolvimento:

```powershell
npm run dev
```

Gerar build do frontend:

```powershell
npm run build
```

## Problemas comuns

### Erro de autenticacao no PostgreSQL

Causa comum:

- senha errada
- password com caractere especial sem encode

Correcao:

- use a senha exatamente como esta no Supabase
- se optar por montar a URL manualmente, encode caracteres especiais

### `prisma db push` falha, mas o app conecta

Motivo comum:

- `DATABASE_URL` aponta para pooler
- operacao de schema precisa usar conexao direta

Correcao:

- mantenha `DIRECT_URL` com a URL direta do Supabase
- deixe o schema Prisma usar `directUrl`

### Frontend abre, mas chamadas `/api` falham

Checklist:

- API realmente subiu em `localhost:3001`
- `npm run dev` esta rodando, nao apenas `npm run dev:web`
- `CORS_ORIGIN` esta como `http://localhost:5173`

### Porta ocupada

Se `3001` estiver em uso, altere no `.env`:

```env
PORT="3002"
```

Se mudar a porta da API e quiser continuar no Vite proxy atual, ajuste tambem `vite.config.ts`.

## Arquivos relevantes

- `.env.example`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `server/index.ts`
- `src/app/lib/api.ts`
- `vite.config.ts`
