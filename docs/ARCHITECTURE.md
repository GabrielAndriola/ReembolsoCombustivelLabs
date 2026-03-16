# Arquitetura do Projeto Reembolso Combustivel Labs

## Ã°Å¸â€œÂ Estrutura de DiretÃƒÂ³rios

```
frontend/src/
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ components/          # Componentes reutilizÃƒÂ¡veis
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ui/             # Componentes base (shadcn/ui)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Layout.tsx      # Layout principal com sidebar
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ EmptyState.tsx  # Estado vazio
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ LoadingState.tsx # Estado de carregamento
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ ...             # Outros componentes
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ contexts/           # Contextos React
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ AuthContext.tsx # Gerenciamento de autenticaÃƒÂ§ÃƒÂ£o
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ lib/                # UtilitÃƒÂ¡rios e dados
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ mock-data.ts    # Dados de demonstraÃƒÂ§ÃƒÂ£o
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ pages/              # PÃƒÂ¡ginas da aplicaÃƒÂ§ÃƒÂ£o
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ employee/       # PÃƒÂ¡ginas do funcionÃƒÂ¡rio
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ supervisor/     # PÃƒÂ¡ginas do supervisor
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Login.tsx       # PÃƒÂ¡gina de login
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ NotFound.tsx    # PÃƒÂ¡gina 404
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ App.tsx             # Componente raiz
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ routes.ts           # ConfiguraÃƒÂ§ÃƒÂ£o de rotas
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ styles/                 # Estilos globais
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ theme.css           # Tokens de design
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tailwind.css        # ImportaÃƒÂ§ÃƒÂ£o do Tailwind
    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ index.css           # Estilos globais
```

## Ã°Å¸â€â€ž Fluxo de Dados

### AutenticaÃƒÂ§ÃƒÂ£o
1. **AuthContext** gerencia o estado global de autenticaÃƒÂ§ÃƒÂ£o
2. Armazena usuÃƒÂ¡rio no localStorage para persistÃƒÂªncia
3. **ProtectedRoute** protege rotas baseado em autenticaÃƒÂ§ÃƒÂ£o e role

### NavegaÃƒÂ§ÃƒÂ£o
1. **React Router Data Mode** gerencia navegaÃƒÂ§ÃƒÂ£o
2. Rotas separadas por perfil (employee/supervisor)
3. Redirecionamento automÃƒÂ¡tico baseado em permissÃƒÂµes

### Dados Mock
- Armazenados em `mock-data.ts`
- Simula funcionÃƒÂ¡rios, registros e configuraÃƒÂ§ÃƒÂµes
- Pronto para ser substituÃƒÂ­do por chamadas de API

## Ã°Å¸Å½Â¨ Sistema de Design

### Cores
Definidas em `/frontend/frontend/src/styles/theme.css`:
- `--primary`: Azul principal (#2563EB)
- `--secondary`: Azul escuro (#0F172A)
- `--accent`: Teal (#14B8A6)
- `--background`: Cinza claro (#F8FAFC)

### Componentes Base
Utilizamos **Radix UI** + **Tailwind CSS**:
- AcessÃƒÂ­veis por padrÃƒÂ£o
- Totalmente customizÃƒÂ¡veis
- CompatÃƒÂ­veis com temas

## Ã°Å¸â€œÂ± Responsividade

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### EstratÃƒÂ©gia Mobile-First
1. Layout mobile por padrÃƒÂ£o
2. Melhorias progressivas para desktop
3. Sidebar responsiva (hamburguer no mobile)

## Ã°Å¸â€Â AutenticaÃƒÂ§ÃƒÂ£o e AutorizaÃƒÂ§ÃƒÂ£o

### Tipos de UsuÃƒÂ¡rio
```typescript
type UserRole = 'employee' | 'supervisor';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
  team?: string;
  avatar?: string;
}
```

### ProteÃƒÂ§ÃƒÂ£o de Rotas
```typescript
<ProtectedRoute requiredRole="supervisor">
  <Layout />
</ProtectedRoute>
```

## Ã°Å¸â€œÅ  CÃƒÂ¡lculo de Reembolso

### FÃƒÂ³rmula Base
```
Valor do Dia = DistÃƒÂ¢ncia (km) Ãƒâ€” Valor por KM
```

### VariÃƒÂ¡veis
- **DistÃƒÂ¢ncia**: Ida + Volta (configurÃƒÂ¡vel por funcionÃƒÂ¡rio)
- **Valor por KM**: R$ 0.85 (padrÃƒÂ£o, customizÃƒÂ¡vel)

### Exemplo
```
FuncionÃƒÂ¡rio mora a 12km da empresa
DistÃƒÂ¢ncia diÃƒÂ¡ria = 12km Ãƒâ€” 2 (ida e volta) = 24km
Valor por dia = 24km Ãƒâ€” R$ 0.85 = R$ 20.40
```

## Ã°Å¸Å½Â¯ Funcionalidades por Perfil

### FuncionÃƒÂ¡rio
- Ã¢Å“â€¦ Dashboard pessoal
- Ã¢Å“â€¦ Registrar presenÃƒÂ§a
- Ã¢Å“â€¦ Visualizar histÃƒÂ³rico prÃƒÂ³prio
- Ã¢Å“â€¦ CalendÃƒÂ¡rio de presenÃƒÂ§as
- Ã¢ÂÅ’ Ver outros funcionÃƒÂ¡rios
- Ã¢ÂÅ’ ConfiguraÃƒÂ§ÃƒÂµes do sistema

### Supervisor
- Ã¢Å“â€¦ Dashboard gerencial
- Ã¢Å“â€¦ Visualizar todos os registros
- Ã¢Å“â€¦ Gerenciar funcionÃƒÂ¡rios
- Ã¢Å“â€¦ Aprovar/rejeitar lanÃƒÂ§amentos
- Ã¢Å“â€¦ Configurar sistema
- Ã¢Å“â€¦ Exportar relatÃƒÂ³rios
- Ã¢Å“â€¦ GrÃƒÂ¡ficos e anÃƒÂ¡lises

## Ã°Å¸Å¡â‚¬ IntegraÃƒÂ§ÃƒÂ£o Futura (Backend)

### Endpoints Sugeridos

```typescript
// AutenticaÃƒÂ§ÃƒÂ£o
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// FuncionÃƒÂ¡rios
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

// Registros de PresenÃƒÂ§a
GET    /api/attendances
GET    /api/attendances/:id
POST   /api/attendances
PUT    /api/attendances/:id
DELETE /api/attendances/:id
POST   /api/attendances/:id/approve
POST   /api/attendances/:id/reject

// ConfiguraÃƒÂ§ÃƒÂµes
GET    /api/config
PUT    /api/config

// RelatÃƒÂ³rios
GET    /api/reports/consolidated
GET    /api/reports/detailed
GET    /api/reports/export/pdf
GET    /api/reports/export/excel
```

## Ã°Å¸Â§Â© Componentes Principais

### Layout
- Sidebar responsiva
- Header com busca e perfil
- ÃƒÂrea de conteÃƒÂºdo principal
- NavegaÃƒÂ§ÃƒÂ£o baseada em role

### Cards de MÃƒÂ©tricas
- KPIs visuais
- ÃƒÂcones contextuais
- Cores por categoria
- AnimaÃƒÂ§ÃƒÂµes sutis

### Tabelas
- Responsivas (cards no mobile)
- OrdenaÃƒÂ§ÃƒÂ£o e filtros
- PaginaÃƒÂ§ÃƒÂ£o
- AÃƒÂ§ÃƒÂµes em linha

### FormulÃƒÂ¡rios
- ValidaÃƒÂ§ÃƒÂ£o em tempo real
- Auto-complete de endereÃƒÂ§os (CEP)
- Feedback visual
- Estados de loading

## Ã°Å¸â€œË† Performance

### OtimizaÃƒÂ§ÃƒÂµes
- Lazy loading de rotas
- MemoizaÃƒÂ§ÃƒÂ£o de componentes pesados
- Virtual scrolling para listas grandes
- Debounce em buscas

### Bundle Size
- Tree shaking automÃƒÂ¡tico
- Code splitting por rota
- CompressÃƒÂ£o de assets

## Ã°Å¸Â§Âª Testing (Futuro)

### EstratÃƒÂ©gia Sugerida
```typescript
// Unit Tests
- Componentes individuais
- FunÃƒÂ§ÃƒÂµes de cÃƒÂ¡lculo
- Contextos

// Integration Tests
- Fluxos de usuÃƒÂ¡rio
- NavegaÃƒÂ§ÃƒÂ£o entre pÃƒÂ¡ginas
- FormulÃƒÂ¡rios completos

// E2E Tests
- Login Ã¢â€ â€™ Dashboard
- Registro de presenÃƒÂ§a
- AprovaÃƒÂ§ÃƒÂ£o de lanÃƒÂ§amentos
```

## Ã°Å¸â€Â§ ManutenÃƒÂ§ÃƒÂ£o

### Adicionar Nova PÃƒÂ¡gina

1. Criar componente em `/frontend/frontend/src/app/pages/`
2. Adicionar rota em `/frontend/frontend/src/app/routes.ts`
3. Adicionar link na navegaÃƒÂ§ÃƒÂ£o em `Layout.tsx`
4. Proteger com `ProtectedRoute` se necessÃƒÂ¡rio

### Adicionar Novo Tipo de UsuÃƒÂ¡rio

1. Atualizar `UserRole` em `AuthContext.tsx`
2. Adicionar permissÃƒÂµes em rotas
3. Criar pÃƒÂ¡ginas especÃƒÂ­ficas
4. Atualizar mock data

### Modificar Tema

1. Editar `/frontend/frontend/src/styles/theme.css`
2. Cores CSS variables auto-aplicadas
3. Tailwind usa as variÃƒÂ¡veis automaticamente

---

DocumentaÃƒÂ§ÃƒÂ£o mantida em: 10/03/2026

