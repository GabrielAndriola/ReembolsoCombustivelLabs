# Reembolso Combustivel Labs

## Documentacao

- Visao geral do projeto: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- Setup local: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- Setup com Docker Compose: [docs/DOCKER_COMPOSE.md](docs/DOCKER_COMPOSE.md)
- Deploy com Docker em servidor: [docs/DEPLOY_DOCKER.md](docs/DEPLOY_DOCKER.md)
- Deploy com Swarm e Traefik: [docs/DEPLOY_SWARM_TRAEFIK.md](docs/DEPLOY_SWARM_TRAEFIK.md)
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
DATABASE_URL="SUPABASE URL"
JWT_SECRET="changeme"
PORT="3001"
CORS_ORIGIN="http://localhost:5173"
VITE_API_BASE_URL=""
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

## Rodando backend no Docker Compose

O projeto agora inclui suporte para subir o backend em `docker compose` usando Supabase externo.

Para o ambiente final:

- frontend publicado no Cloudflare Pages
- backend publicado em Docker na infraestrutura da empresa
- frontend usando `VITE_API_BASE_URL` para chamar a URL publica da API
- backend liberando o dominio do frontend via `CORS_ORIGIN`

Fluxo rapido:

```bash
Copy-Item .env.docker.example .env.docker
docker compose up --build -d
```

Validacoes:

- API: `http://localhost:3001/api/health`
- Banco: Supabase externo configurado em `.env.docker`
- Observacao: neste ambiente, a API em container funcionou com o pooler do Supabase, mas `db:push` precisou continuar fora do container por causa da resolucao da `DIRECT_URL`

Documentacao completa:

- [docs/DOCKER_COMPOSE.md](docs/DOCKER_COMPOSE.md)

## Deploy final na empresa

O desenho final definido para producao ficou assim:

- frontend em imagem Docker
- backend em imagem Docker
- PostgreSQL em container Docker
- Traefik publicando `https://meureembolso.crisdulabs.com.br`
- Cloudflare apenas no DNS

Documentacao operacional:

- [docs/DEPLOY_SWARM_TRAEFIK.md](docs/DEPLOY_SWARM_TRAEFIK.md)

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
