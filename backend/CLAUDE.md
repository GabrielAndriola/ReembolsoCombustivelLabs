# Backend — CLAUDE.md

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express 5
- **ORM:** Prisma 6 + PostgreSQL 16
- **Linguagem:** TypeScript (ES2022, `type: "module"`)
- **Autenticação:** JWT (7 dias de expiração)
- **Validação:** Zod 4
- **Hash de senha:** bcryptjs

## Estrutura de Pastas

```
backend/
├── api/            # Rotas Express (uma por domínio)
├── services/       # Lógica de negócio
├── repositories/   # Acesso a dados via Prisma
├── middleware/     # auth.ts (authenticate, requireRole)
├── lib/            # env.ts (Zod), prisma.ts (cliente singleton)
├── utils/          # jwt, password, distance, date, app-error, serializers
├── server/         # index.ts — entry point do servidor
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Arquitetura em 3 Camadas

```
API route → Service → Repository → Prisma
```

- **Routes (`api/`):** validação Zod do body, chama service, passa erros para `next(error)`
- **Services (`services/`):** lógica de negócio, orquestra repositories, lança `AppError`
- **Repositories (`repositories/`):** queries Prisma, sem lógica de negócio

## Padrão de Rota

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { myService } from '../services/myService';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  value: z.number().positive()
});

// Rota pública com validação
router.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const result = await myService.create(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Rota autenticada com proteção de role
router.get('/', authenticate, requireRole('supervisor', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await myService.list(req.auth!.companyId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Padrão de Service

```typescript
import { myRepository } from '../repositories/myRepository';
import { AppError } from '../utils/app-error';

export const myService = {
  async create(data: { name: string; value: number }) {
    const existing = await myRepository.findByName(data.name);
    if (existing) throw new AppError('Já existe um registro com esse nome.', 409);
    return myRepository.create(data);
  }
};
```

## Padrão de Repository

```typescript
import { prisma } from '../lib/prisma';

export const myRepository = {
  findByName(name: string) {
    return prisma.myModel.findFirst({ where: { name } });
  },

  create(data: { name: string; value: number }) {
    return prisma.myModel.create({ data });
  }
};
```

## Tratamento de Erros

- Use `AppError` para erros de negócio com status HTTP explícito
- Sempre passe para `next(error)` — nunca trate direto na rota com `res.status(500)`
- O middleware global de erro (`server/index.ts`) trata `AppError` e erros Zod automaticamente

```typescript
import { AppError } from '../utils/app-error';

// Uso correto
throw new AppError('Registro não encontrado.', 404);
throw new AppError('Credenciais inválidas.', 401);
throw new AppError('Sem permissão.', 403);
```

## Autenticação e Autorização

```typescript
// Sem autenticação
router.post('/login', handler);

// Apenas autenticado (qualquer role)
router.get('/me', authenticate, handler);

// Role específica
router.get('/employees', authenticate, requireRole('supervisor', 'admin'), handler);

// Múltiplos middlewares + acessar dados do usuário autenticado
const handler = async (req: AuthenticatedRequest, res, next) => {
  const { userId, role, companyId } = req.auth!;
};
```

## Banco de Dados (Prisma)

- **Schema:** `backend/prisma/schema.prisma`
- **Atualizar schema:** `npm run db:push` (dev) — nunca editar o banco diretamente
- **Gerar client:** `npm run db:generate` após alterar o schema
- IDs com CUID: `@id @default(cuid())`
- Valores monetários e km: `Decimal @db.Decimal(10, 2)` — serializar para `number` nas respostas
- Datas: `DateTime` sempre em UTC

### Modelos Principais

| Modelo | Descrição |
|--------|-----------|
| `Company` | Empresa (multi-tenant) |
| `User` | Usuário com `role: ADMIN/SUPERVISOR/EMPLOYEE` |
| `EmployeeProfile` | Perfil do funcionário (código, depto, supervisor, distâncias) |
| `PresenceRecord` | Registro diário de presença com cálculo de reembolso |
| `MonthlyRate` | Taxa R$/km por funcionário por mês |
| `Address` | Endereço com coordenadas (lat/lng) |
| `CompanyPeriod` | Configuração de período mensal por empresa |

## Variáveis de Ambiente

Validadas via Zod em `backend/lib/env.ts`:

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL | Sim |
| `DIRECT_URL` | Connection direta (Prisma) | Não |
| `JWT_SECRET` | Chave de assinatura JWT | Sim |
| `PORT` | Porta do servidor (padrão: 3000) | Não |
| `CORS_ORIGIN` | Origens permitidas (separadas por vírgula) | Sim |

## Utilitários Disponíveis

- `backend/utils/jwt.ts` — `signToken(payload)`, `verifyToken(token)`
- `backend/utils/password.ts` — `hashPassword(plain)`, `comparePassword(plain, hash)`
- `backend/utils/distance.ts` — cálculo de distância haversine entre coordenadas
- `backend/utils/date.ts` — helpers de data
- `backend/utils/app-error.ts` — classe `AppError(message, statusCode)`
- `backend/utils/serializers.ts` — `serializeRole()` converte enum DB para string lowercase

## Seed

O seed (`backend/prisma/seed.ts`) requer flag de segurança:

```bash
ALLOW_DESTRUCTIVE_SEED=true npm run db:seed
```

Dados criados: 1 empresa, 1 admin, 1 supervisor, 3 funcionários, registros de presença com taxa padrão de R$ 0,65/km.

## Regras de Negócio Importantes

- Cada `PresenceRecord` armazena os valores de distância e taxa no momento do cálculo (não referência dinâmica)
- `distanceOneWayKm` e `distanceRoundTripKm` vêm do `EmployeeProfile` no momento do registro
- Um funcionário só pode ter um registro por dia (`@@unique([employeeUserId, presenceDate])`)
- Taxas mensais (`MonthlyRate`) são por funcionário por mês/ano — sem taxa cadastrada, usa 0
