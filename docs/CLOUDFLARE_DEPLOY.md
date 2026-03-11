# Deploy na Cloudflare

## Escopo real deste deploy

O repositorio atual nao e um app 100% Cloudflare-native. Ele tem:

- frontend estatico em Vite, ideal para Cloudflare Pages
- backend Node/Express com Prisma, que precisa rodar em um ambiente Node

Por isso, o deploy recomendado hoje e:

1. Frontend na Cloudflare Pages
2. Backend em um host Node separado
3. Banco no Supabase

Esse caminho funciona com o codigo atual e exige poucas mudancas.

## Arquitetura recomendada de producao

- Cloudflare Pages: hospeda o frontend compilado
- Backend Node: Render, Railway, Fly.io, VPS ou outro ambiente Node
- Supabase PostgreSQL: banco principal

Fluxo:

```text
Usuario -> Cloudflare Pages (frontend)
Frontend -> API Node externa
API Node -> Supabase PostgreSQL
```

## O que foi preparado no projeto

Este repositorio agora ja suporta o necessario para esse deploy:

- `VITE_API_BASE_URL` para apontar o frontend para a API publica
- `CORS_ORIGIN` para liberar o dominio do frontend em producao
- `public/_redirects` para SPA fallback do React Router na Cloudflare Pages
- `DIRECT_URL` no Prisma para operacoes de schema

## Valores de banco recomendados

### Runtime da API

Use no backend:

```env
DATABASE_URL="postgresql://postgres.anlywqfolgtupofelvou:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

### Operacoes Prisma de schema

Use no backend:

```env
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.anlywqfolgtupofelvou.supabase.co:5432/postgres?sslmode=require"
```

## Etapa 1: gerar um backend publico

Cloudflare Pages nao vai hospedar este `server/index.ts`. Entao primeiro voce precisa colocar a API em um host Node.

### Variaveis do backend

No host do backend, configure:

```env
DATABASE_URL="postgresql://postgres.anlywqfolgtupofelvou:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.anlywqfolgtupofelvou.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="troque-por-um-segredo-forte"
PORT="3001"
CORS_ORIGIN="https://SEU-FRONTEND.pages.dev,https://app.seudominio.com"
```

Se voce ainda nao tiver dominio proprio, pode deixar inicialmente:

```env
CORS_ORIGIN="https://SEU-PROJETO.pages.dev"
```

### Comandos que o backend precisa executar

No ambiente de build/deploy do backend:

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

Depois iniciar a API em producao com um processo Node/tsx compatível com seu host. Como o repositório nao tem script `start` ainda, o comando atual equivalente e:

```powershell
npx tsx server/index.ts
```

Se o seu provedor pedir um start command explicito, use esse.

### Checklist do backend

Quando o backend estiver publicado, valide:

```text
https://sua-api.com/api/health
```

Resposta esperada:

```json
{"status":"ok"}
```

## Etapa 2: preparar o frontend para Cloudflare Pages

### Variaveis do frontend

Na Cloudflare Pages, configure:

```env
VITE_API_BASE_URL=https://sua-api.com
```

Nao coloque barra no final.

Exemplo correto:

```env
VITE_API_BASE_URL=https://api.km-presencial.com
```

Exemplo errado:

```env
VITE_API_BASE_URL=https://api.km-presencial.com/
```

### Build settings da Cloudflare Pages

Ao criar o projeto na Cloudflare Pages:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## Etapa 3: deploy pela interface da Cloudflare Pages

### Opcao A: conectar GitHub

1. Suba este repositorio para GitHub.
2. Entre na Cloudflare Dashboard.
3. Acesse `Workers & Pages`.
4. Clique em `Create application`.
5. Escolha `Pages`.
6. Escolha `Connect to Git`.
7. Autorize o repositorio.
8. Selecione a branch desejada.
9. Preencha:

```text
Build command: npm run build
Build output directory: dist
```

10. Em `Environment Variables`, adicione:

```text
VITE_API_BASE_URL = https://sua-api.com
```

11. Execute o deploy.

### Opcao B: deploy manual com Wrangler

Se preferir deploy manual pelo terminal, instale o Wrangler globalmente:

```powershell
npm install -g wrangler
```

Faca login:

```powershell
wrangler login
```

Gere o build:

```powershell
npm install
npm run build
```

Depois publique usando Pages:

```powershell
wrangler pages deploy dist
```

Se quiser nomear o projeto no primeiro deploy:

```powershell
wrangler pages deploy dist --project-name km-presencial
```

## Etapa 4: dominio customizado

Se quiser usar dominio proprio:

1. Abra seu projeto na Cloudflare Pages.
2. Entre em `Custom domains`.
3. Clique em `Set up a custom domain`.
4. Informe algo como:

```text
app.seudominio.com
```

5. Depois atualize o backend:

```env
CORS_ORIGIN="https://app.seudominio.com"
```

6. Se mantiver o subdominio `pages.dev` ativo tambem:

```env
CORS_ORIGIN="https://SEU-PROJETO.pages.dev,https://app.seudominio.com"
```

## Etapa 5: fluxo completo de producao

### Backend

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
npx tsx server/index.ts
```

### Frontend

```powershell
npm install
$env:VITE_API_BASE_URL="https://sua-api.com"
npm run build
wrangler pages deploy dist --project-name km-presencial
```

## Validacao apos deploy

### 1. API no ar

Teste:

```text
https://sua-api.com/api/health
```

### 2. Frontend no ar

Teste:

```text
https://SEU-PROJETO.pages.dev/login
```

### 3. Roteamento SPA

Teste abrir diretamente:

```text
https://SEU-PROJETO.pages.dev/employee/dashboard
```

Isso precisa carregar o app, nao retornar 404. O arquivo `public/_redirects` foi adicionado para isso.

### 4. Login completo

Entre com:

- `gabriel.andriola@crisdu.com.br`
- senha `12345678`

Se falhar, os tres pontos para verificar primeiro sao:

- `VITE_API_BASE_URL`
- `CORS_ORIGIN`
- disponibilidade da API publica

## Problemas comuns

### O frontend abre, mas o login falha com erro de CORS

Causa:

- backend nao liberou o dominio do Pages

Correcao:

```env
CORS_ORIGIN="https://SEU-PROJETO.pages.dev"
```

ou:

```env
CORS_ORIGIN="https://SEU-PROJETO.pages.dev,https://app.seudominio.com"
```

Reinicie o backend depois de alterar.

### O frontend tenta chamar `/api/...` no proprio dominio do Pages

Causa:

- `VITE_API_BASE_URL` nao foi definido no deploy

Correcao:

- adicione `VITE_API_BASE_URL=https://sua-api.com`
- faça novo build/deploy

### Abrir rota interna retorna 404

Causa:

- faltando fallback SPA

Correcao:

- confirmar que `public/_redirects` foi para o build final
- fazer novo deploy

### Prisma falha no `db push`

Causa comum:

- uso do pooler para operacao de schema

Correcao:

- manter `DIRECT_URL` com a conexao direta

## O que nao esta coberto por este doc

Nao documentei backend rodando dentro de Cloudflare Workers/Pages Functions porque o codigo atual nao foi desenhado para isso. Hoje ele usa:

- Express
- Prisma Client padrao
- processo Node persistente

Se voce quiser, no proximo passo eu posso fazer uma segunda fase e adaptar o projeto para uma arquitetura mais Cloudflare-native.
