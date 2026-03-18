# Frontend — CLAUDE.md

## Stack

- **Framework:** React 18.3.1
- **Build:** Vite 6.3.5
- **Linguagem:** TypeScript (ES2022)
- **Estilização:** TailwindCSS 4.1.12 (via `@tailwindcss/vite`)
- **Componentes UI:** Radix UI (headless) + shadcn/ui pattern
- **Roteamento:** React Router 7.13
- **Formulários:** React Hook Form 7.55
- **Validação:** Zod 4
- **Charts:** Recharts 2
- **Animações:** Motion 12
- **Toasts:** Sonner 2
- **Ícones:** Lucide React + MUI Icons

## Estrutura de Pastas

```
frontend/src/
├── app/
│   ├── App.tsx                   # Root: AuthProvider + RouterProvider + Toaster
│   ├── routes.tsx                # Definição de rotas
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                   # Componentes base Radix/shadcn (não editar diretamente)
│   │   ├── figma/                # Componentes vindos do Figma
│   │   ├── Layout.tsx            # Layout principal com sidebar/header
│   │   ├── ProtectedRoute.tsx    # Guard de rota por role
│   │   ├── AttendanceCalendar.tsx
│   │   ├── RegisterAttendanceModal.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StatCard.tsx
│   │   ├── MetricCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── employee/             # Páginas do funcionário
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   └── EmployeeHistory.tsx
│   │   └── supervisor/           # Páginas do supervisor
│   │       ├── SupervisorDashboard.tsx
│   │       ├── EmployeesManagement.tsx
│   │       ├── EmployeeForm.tsx
│   │       ├── Reports.tsx
│   │       └── Settings.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx       # Estado global de autenticação
│   └── lib/
│       └── api.ts                # Cliente HTTP + tipos de resposta + authStorage
└── styles/                       # CSS global e configurações de tema
```

## Roteamento

```typescript
// routes.tsx — estrutura atual
/ (root)           → redireciona por role
/login             → público
/employee/dashboard
/employee/history
/supervisor/dashboard
/supervisor/employees
/supervisor/reports
/supervisor/settings
```

- Rotas protegidas usam `<ProtectedRoute>` com verificação de role
- Redirecionamento automático após login baseado no `user.role`

## Autenticação

O `AuthContext` é o único ponto de verdade para o estado do usuário:

```typescript
import { useAuth } from '../contexts/AuthContext';

const { user, login, logout, isAuthenticated, isLoading } = useAuth();
```

- Token armazenado em `localStorage` com chave `meureembolso_token`
- User serializado em `localStorage` com chave `meureembolso_user`
- Bootstrap automático no mount: valida o token via `GET /api/auth/me`
- Avatar gerado via DiceBear API pelo nome do usuário

## Cliente de API

Todas as chamadas à API passam por `frontend/src/app/lib/api.ts`:

```typescript
import { api } from '../lib/api';

// Exemplos de uso
const dashboard = await api.getMyDashboard(month, year);
const employees = await api.getEmployees();
await api.createMyPresences({ month, year, dates: ['2025-01-15'], observation: '' });
await api.updatePresenceStatus(id, 'approved');
```

- Função interna `request<T>()` injeta o token Bearer automaticamente
- Erros HTTP são convertidos em `Error` com a mensagem da API (`payload.message`)
- `VITE_API_BASE_URL` prefixado em todas as chamadas (vazio em dev — proxy Vite redireciona `/api`)
- Não usar `fetch` diretamente nas pages/components; sempre usar `api.*`

## Padrão de Componente

```typescript
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

interface MyComponentProps {
  title: string;
  onAction: (id: string) => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await api.someCall();
      onAction(user!.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Carregando...' : 'Ação'}
      </Button>
    </div>
  );
}
```

## Formulários com React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  value: z.number().positive('Valor deve ser positivo')
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', value: 0 }
  });

  const onSubmit = async (data: FormData) => {
    await api.createSomething(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

## Componentes UI (Radix/shadcn)

Os componentes em `components/ui/` são wrappers sobre Radix UI seguindo o padrão shadcn. **Não editar diretamente** — customize via props ou crie wrappers.

Componentes disponíveis: `Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Table`, `Card`, `Badge`, `Tabs`, `Calendar`, `Form`, `Label`, `Textarea`, `Switch`, `Checkbox`, `Avatar`, `Tooltip`, `Popover`, `DropdownMenu`, `Separator`, `Skeleton`, `Sonner` e outros.

## Estilização

- **TailwindCSS 4** — configurado via `@tailwindcss/vite` (sem `tailwind.config.js`)
- Usar utilitários Tailwind diretamente nas classes
- `cn()` (de `clsx` + `tailwind-merge`) para classes condicionais:

```typescript
import { cn } from '../lib/utils'; // se existir, ou usar clsx diretamente

<div className={cn('base-class', condition && 'conditional-class', props.className)} />
```

- Animações com a biblioteca `motion`:

```typescript
import { motion } from 'motion/react';

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
  content
</motion.div>
```

## Toasts

```typescript
import { toast } from 'sonner';

toast.success('Registro salvo com sucesso!');
toast.error('Erro ao salvar. Tente novamente.');
toast.info('Processando...');
```

## Tipos da API

Todos os tipos de request/response estão em `frontend/src/app/lib/api.ts`. Reutilize-os — não redefina interfaces que já existem:

- `AuthUser`, `ProfileResponse`, `PresenceResponse`, `EmployeeResponse`
- `MonthlyReportResponse`, `EmployeeDashboardResponse`, `SupervisorOverviewResponse`
- `CreateEmployeePayload`, `UpdateCompanyAddressPayload`, `CompanyPeriodResponse`

## Configurações do Vite

- **Proxy dev:** `/api` → `http://localhost:3001` (automático, sem configurar `VITE_API_BASE_URL`)
- **Alias:** `@` → `/frontend/src`
- **Porta:** 5173 por padrão

## Regras de Código

- Sem `any` — use tipos explícitos ou `unknown` com narrowing
- Componentes de página em `pages/`, componentes reutilizáveis em `components/`
- Estado global apenas via Context (não criar stores Redux/Zustand sem necessidade)
- Chamadas à API sempre em handlers de evento ou `useEffect`, nunca no corpo do componente
- Erros de API sempre exibidos via `toast.error()` com a mensagem da resposta
- Datas vêm da API como strings ISO; usar `date-fns` para formatação
