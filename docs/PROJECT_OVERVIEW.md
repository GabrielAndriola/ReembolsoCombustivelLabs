# Resumo do Projeto

## Nome

`Reembolso Combustivel Labs`

## O que este sistema faz

Sistema interno para controle de presencas presenciais e calculo de reembolso de combustivel por quilometragem.

Hoje ele cobre principalmente:

- autenticacao de usuarios
- cadastro e edicao de funcionarios
- definicao de tarifa `R$/km`
- registro de presencas
- aprovacao de solicitacoes por supervisor/admin
- relatorios gerenciais

## Stack do projeto

### Frontend

- React
- Vite
- TypeScript
- Tailwind

O frontend fica principalmente em:

- `src/`

### Backend

- Node.js
- Express
- TypeScript executado com `tsx`
- Prisma

O backend fica principalmente em:

- `server/`
- `api/`
- `services/`
- `repositories/`
- `middleware/`
- `lib/`

### Banco de dados

- PostgreSQL
- hoje preparado para Supabase

Schema e seed ficam em:

- `prisma/schema.prisma`
- `prisma/seed.ts`

## Front e back sao separados?

Sim e nao.

Eles sao separados em responsabilidade, mas estao no mesmo repositorio.

Na pratica:

- o frontend e uma aplicacao Vite/React
- o backend e uma API Express
- os dois convivem no mesmo projeto

Entao este projeto e um `monorepo simples`, com:

- um frontend
- uma API
- um banco externo

## O deploy sobe tudo junto ou separado?

### Em desenvolvimento

Sobe junto com:

```bash
npm run dev
```

Esse comando inicia:

- frontend Vite
- backend Express

### Em producao

Logicamente os dois fazem parte da mesma aplicacao, mas tecnicamente sobem separados:

- o frontend vira arquivos estaticos da pasta `dist/`
- o backend sobe como processo Node/Express

Entao, no deploy interno, o normal e:

1. gerar o build do frontend
2. publicar o frontend no servidor web
3. subir a API como servico
4. colocar um proxy reverso de `/api` para a API

## Como isso fica no servidor

Arquitetura recomendada:

- frontend estatico servido por IIS ou Nginx
- API Node/Express rodando separadamente
- banco PostgreSQL remoto

Exemplo:

- navegador acessa `http://servidor-interno`
- frontend chama `/api/...`
- IIS ou Nginx encaminha `/api/...` para a API local

## Precisa publicar dois projetos diferentes?

Nao precisa separar em dois repositorios.

Mas operacionalmente existem dois artefatos:

- frontend compilado
- backend em execucao

Ou seja:

- repositorio: unico
- deploy: duas partes complementares

## Estrutura principal

- `src/`: frontend
- `server/`: bootstrap da API
- `api/`: rotas HTTP
- `services/`: regras de negocio
- `repositories/`: acesso a dados
- `middleware/`: auth e tratamento de erro
- `lib/`: env, Prisma e utilitarios base
- `utils/`: helpers gerais
- `prisma/`: schema e seed
- `public/`: assets estaticos
- `docs/`: documentacao operacional

## Fluxo resumido da aplicacao

1. Usuario acessa o frontend
2. Frontend chama a API
3. API valida autenticacao e regras de negocio
4. API persiste e consulta dados via Prisma
5. Banco retorna os dados
6. Frontend renderiza dashboard, historico, relatorios e configuracoes

## Como explicar rapidamente para outra pessoa

Frase curta:

`E um sistema web interno de reembolso de combustivel, com frontend React/Vite e backend Node/Express no mesmo repositorio, usando PostgreSQL via Prisma.`

Explicacao um pouco mais completa:

`O projeto nao e Next.js. O front e Vite/React e a API e Express. Eles ficam juntos no mesmo repositorio, mas em producao o frontend sobe como site estatico e o backend sobe como servico separado, normalmente atras de um proxy reverso em /api.`

## Documentos relacionados

- `docs/LOCAL_SETUP.md`
- `docs/DEPLOY_WINDOWS.md`
- `docs/DEPLOY_LINUX.md`
- `README.md`
