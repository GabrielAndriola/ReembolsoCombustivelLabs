# Reembolso Combustivel Labs

## Documentacao

- Visao geral do projeto: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- Setup local: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- Deploy do backend em Linux: [docs/DEPLOY_BACKEND_LINUX.md](docs/DEPLOY_BACKEND_LINUX.md)
- Deploy interno em Windows: [docs/DEPLOY_WINDOWS.md](docs/DEPLOY_WINDOWS.md)
- Deploy interno em Linux: [docs/DEPLOY_LINUX.md](docs/DEPLOY_LINUX.md)

MVP da plataforma de controle de dias presenciais com cálculo automático de reembolso por quilometragem.

## Arquitetura atual

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: API Node/Express no mesmo repositório
- Banco: Prisma preparado para PostgreSQL/Supabase
- Auth: JWT
- Validação: Zod

Mantive o frontend atual e abstraí o trecho do prompt que exigia Next.js, porque o projeto já nasceu em Vite. O resultado é um MVP funcional mais rápido de evoluir sem reescrever a interface inteira.

## Estrutura principal

- `src/`: frontend
- `api/`: rotas HTTP
- `services/`: regras de negócio
- `repositories/`: acesso a dados com Prisma
- `middleware/`: autenticação e tratamento de erros
- `lib/`: cliente Prisma, env, fallback local
- `utils/`: JWT, senha, datas, distância
- `prisma/`: schema e seed
- `server/`: bootstrap da API

## Setup

1. Instale dependências:

```bash
npm install
```

2. Revise o arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:gremio3541A.%40@db.anlywqfolgtupofelvou.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="changeme"
PORT="3001"
```

3. Gere o client Prisma:

```bash
npm run db:generate
```

4. Se a sua URL do Supabase estiver correta e acessível:

```bash
npm run db:push
npm run db:seed
```

5. Suba frontend e API juntos:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3001`

## Credenciais de demonstração

- Funcionário: `gabriel.andriola@crisdu.com.br`
- Supervisor: `willian@crisdu.com.br`
- Admin: `admin@crisdu.com.br`
- Senha: `12345678`

## O que já está funcionando

- Login com JWT
- Persistência preparada com Prisma
- Endpoints:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/me/profile`
  - `GET /api/me/presences`
  - `POST /api/me/presences`
  - `GET /api/me/summary`
  - `GET /api/employees`
  - `POST /api/employees`
  - `GET /api/employees/:id`
  - `GET /api/reports/monthly`
- Dashboard do funcionário consumindo API
- Histórico do funcionário consumindo API
- Registro em lote de dias presenciais

## Observação importante sobre o Supabase do prompt

A connection string enviada no prompt aponta para o host:

`db.anlywqfolgtupofelvou.supabase.co`

Hoje esse host não resolve DNS no ambiente de execução. Por isso:

- `npm run db:generate` funciona
- `npm run db:push` e `npm run db:seed` não puderam ser concluídos contra esse banco

Para o app não ficar parado, deixei um fallback local em memória no backend. Assim o login, dashboard e histórico continuam funcionando enquanto você me passa a URL correta do Supabase.

## Próximos passos recomendados

1. Corrigir a `DATABASE_URL` real do Supabase
2. Executar `npm run db:push`
3. Executar `npm run db:seed`
4. Remover o fallback em memória
5. Conectar supervisor, relatórios e gestão de funcionários à base real
