# Deploy Interno em Windows

## Objetivo

Subir o `Reembolso Combustivel Labs` em um servidor Windows interno da empresa, deixando:

- frontend estatico servido por IIS
- API Node/Express rodando como servico Windows
- banco apontando para Supabase PostgreSQL

Este guia assume:

- Windows Server 2019 ou superior
- Node.js 20+
- npm 10+
- IIS instalado
- acesso ao Supabase

## Arquitetura recomendada

- frontend: IIS servindo a pasta `dist/`
- API: `node` executando `backend/server/index.ts` por servico
- acesso interno:
  - frontend: `http://servidor-interno/`
  - API: `http://servidor-interno:3001/` ou via reverse proxy em `/api`

Melhor opcao:

- servir o frontend em `80/443`
- publicar a API atras do IIS como reverse proxy em `/api`

## 1. Preparar o servidor

Instalar:

```powershell
node -v
npm -v
```

Se ainda nao existir:

1. Instale Node.js LTS.
2. Instale IIS com:
   - `Web Server (IIS)`
   - `Static Content`
   - `Request Routing`
   - `URL Rewrite`

## 2. Copiar o projeto

Exemplo:

```powershell
New-Item -ItemType Directory -Force C:\apps\reembolso-combustivel-labs
```

Copie os arquivos do projeto para:

```text
C:\apps\reembolso-combustivel-labs
```

## 3. Configurar `.env`

Na raiz do projeto, crie ou ajuste:

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

Na raiz do projeto:

```powershell
npm install
npm run db:generate
npm run build
```

Se precisar sincronizar schema:

```powershell
npm run db:push
```

Se precisar popular dados:

```powershell
npm run db:seed
```

## 5. Publicar o frontend no IIS

Crie a pasta de publicacao:

```powershell
New-Item -ItemType Directory -Force C:\inetpub\reembolso-combustivel-labs
Copy-Item .\dist\* C:\inetpub\reembolso-combustivel-labs -Recurse -Force
```

No IIS:

1. Crie um novo site apontando para:

```text
C:\inetpub\reembolso-combustivel-labs
```

2. Configure a binding interna:

```text
http://servidor-interno:80
```

## 6. Configurar SPA fallback no IIS

Crie o arquivo `web.config` em `C:\inetpub\reembolso-combustivel-labs`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReactRoutes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## 7. Rodar a API como servico Windows

Opcao recomendada: `nssm`.

Baixe e instale `nssm`, depois registre o servico:

```powershell
nssm install ReembolsoCombustivelLabsApi
```

Configure:

- `Application path`:

```text
C:\Program Files\nodejs\node.exe
```

- `Startup directory`:

```text
C:\apps\reembolso-combustivel-labs
```

- `Arguments`:

```text
node_modules\tsx\dist\cli.mjs backend/server/index.ts
```

Defina variaveis de ambiente do servico:

```text
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
PORT=3001
CORS_ORIGIN=http://servidor-interno
```

Depois:

```powershell
nssm start ReembolsoCombustivelLabsApi
```

## 8. Configurar reverse proxy `/api` no IIS

No site do frontend, adicione uma regra de rewrite:

- quando a URL comecar com `/api`
- encaminhar para:

```text
http://localhost:3001/{R:0}
```

Exemplo de regra:

```xml
<rule name="ApiProxy" stopProcessing="true">
  <match url="^api/(.*)" />
  <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
</rule>
```

Se usar essa abordagem:

- o frontend continua chamando `/api`
- nao precisa expor a porta `3001` para os usuarios

## 9. Atualizacao de versao

Quando publicar nova versao:

```powershell
Set-Location C:\apps\reembolso-combustivel-labs
npm install
npm run db:generate
npm run build
Copy-Item .\dist\* C:\inetpub\reembolso-combustivel-labs -Recurse -Force
Restart-Service ReembolsoCombustivelLabsApi
```

Se houver mudanca de schema:

```powershell
npm run db:push
```

## 10. Validacao

API:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```

Frontend:

```text
http://servidor-interno
```

Login esperado:

- `admin@crisdu.com.br`
- `willian@crisdu.com.br`
- `gabriel.andriola@crisdu.com.br`
- senha: `12345678`

## Problemas comuns

### API sobe manualmente, mas nao como servico

Verifique:

- diretorio inicial do servico
- caminho do `node.exe`
- caminho do `tsx`
- variaveis de ambiente do servico

### Frontend abre, mas rotas internas retornam 404

Falta o fallback SPA para `index.html` no IIS.

### Login funciona local, mas nao no navegador do servidor

Verifique:

- `CORS_ORIGIN`
- regra `/api` no IIS
- se a API esta realmente escutando em `localhost:3001`

### `db push` falha

Use `DIRECT_URL` com a conexao direta do Supabase.



