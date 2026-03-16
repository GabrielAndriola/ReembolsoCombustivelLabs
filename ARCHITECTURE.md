# Arquitetura do Projeto Reembolso Combustivel Labs

## ðŸ“ Estrutura de DiretÃ³rios

```
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ components/          # Componentes reutilizÃ¡veis
â”‚   â”‚   â”œâ”€â”€ ui/             # Componentes base (shadcn/ui)
â”‚   â”‚   â”œâ”€â”€ Layout.tsx      # Layout principal com sidebar
â”‚   â”‚   â”œâ”€â”€ EmptyState.tsx  # Estado vazio
â”‚   â”‚   â”œâ”€â”€ LoadingState.tsx # Estado de carregamento
â”‚   â”‚   â””â”€â”€ ...             # Outros componentes
â”‚   â”œâ”€â”€ contexts/           # Contextos React
â”‚   â”‚   â””â”€â”€ AuthContext.tsx # Gerenciamento de autenticaÃ§Ã£o
â”‚   â”œâ”€â”€ lib/                # UtilitÃ¡rios e dados
â”‚   â”‚   â””â”€â”€ mock-data.ts    # Dados de demonstraÃ§Ã£o
â”‚   â”œâ”€â”€ pages/              # PÃ¡ginas da aplicaÃ§Ã£o
â”‚   â”‚   â”œâ”€â”€ employee/       # PÃ¡ginas do funcionÃ¡rio
â”‚   â”‚   â”œâ”€â”€ supervisor/     # PÃ¡ginas do supervisor
â”‚   â”‚   â”œâ”€â”€ Login.tsx       # PÃ¡gina de login
â”‚   â”‚   â””â”€â”€ NotFound.tsx    # PÃ¡gina 404
â”‚   â”œâ”€â”€ App.tsx             # Componente raiz
â”‚   â””â”€â”€ routes.ts           # ConfiguraÃ§Ã£o de rotas
â””â”€â”€ styles/                 # Estilos globais
    â”œâ”€â”€ theme.css           # Tokens de design
    â”œâ”€â”€ tailwind.css        # ImportaÃ§Ã£o do Tailwind
    â””â”€â”€ index.css           # Estilos globais
```

## ðŸ”„ Fluxo de Dados

### AutenticaÃ§Ã£o
1. **AuthContext** gerencia o estado global de autenticaÃ§Ã£o
2. Armazena usuÃ¡rio no localStorage para persistÃªncia
3. **ProtectedRoute** protege rotas baseado em autenticaÃ§Ã£o e role

### NavegaÃ§Ã£o
1. **React Router Data Mode** gerencia navegaÃ§Ã£o
2. Rotas separadas por perfil (employee/supervisor)
3. Redirecionamento automÃ¡tico baseado em permissÃµes

### Dados Mock
- Armazenados em `mock-data.ts`
- Simula funcionÃ¡rios, registros e configuraÃ§Ãµes
- Pronto para ser substituÃ­do por chamadas de API

## ðŸŽ¨ Sistema de Design

### Cores
Definidas em `/src/styles/theme.css`:
- `--primary`: Azul principal (#2563EB)
- `--secondary`: Azul escuro (#0F172A)
- `--accent`: Teal (#14B8A6)
- `--background`: Cinza claro (#F8FAFC)

### Componentes Base
Utilizamos **Radix UI** + **Tailwind CSS**:
- AcessÃ­veis por padrÃ£o
- Totalmente customizÃ¡veis
- CompatÃ­veis com temas

## ðŸ“± Responsividade

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### EstratÃ©gia Mobile-First
1. Layout mobile por padrÃ£o
2. Melhorias progressivas para desktop
3. Sidebar responsiva (hamburguer no mobile)

## ðŸ” AutenticaÃ§Ã£o e AutorizaÃ§Ã£o

### Tipos de UsuÃ¡rio
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

### ProteÃ§Ã£o de Rotas
```typescript
<ProtectedRoute requiredRole="supervisor">
  <Layout />
</ProtectedRoute>
```

## ðŸ“Š CÃ¡lculo de Reembolso

### FÃ³rmula Base
```
Valor do Dia = DistÃ¢ncia (km) Ã— Valor por KM
```

### VariÃ¡veis
- **DistÃ¢ncia**: Ida + Volta (configurÃ¡vel por funcionÃ¡rio)
- **Valor por KM**: R$ 0.85 (padrÃ£o, customizÃ¡vel)

### Exemplo
```
FuncionÃ¡rio mora a 12km da empresa
DistÃ¢ncia diÃ¡ria = 12km Ã— 2 (ida e volta) = 24km
Valor por dia = 24km Ã— R$ 0.85 = R$ 20.40
```

## ðŸŽ¯ Funcionalidades por Perfil

### FuncionÃ¡rio
- âœ… Dashboard pessoal
- âœ… Registrar presenÃ§a
- âœ… Visualizar histÃ³rico prÃ³prio
- âœ… CalendÃ¡rio de presenÃ§as
- âŒ Ver outros funcionÃ¡rios
- âŒ ConfiguraÃ§Ãµes do sistema

### Supervisor
- âœ… Dashboard gerencial
- âœ… Visualizar todos os registros
- âœ… Gerenciar funcionÃ¡rios
- âœ… Aprovar/rejeitar lanÃ§amentos
- âœ… Configurar sistema
- âœ… Exportar relatÃ³rios
- âœ… GrÃ¡ficos e anÃ¡lises

## ðŸš€ IntegraÃ§Ã£o Futura (Backend)

### Endpoints Sugeridos

```typescript
// AutenticaÃ§Ã£o
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// FuncionÃ¡rios
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

// Registros de PresenÃ§a
GET    /api/attendances
GET    /api/attendances/:id
POST   /api/attendances
PUT    /api/attendances/:id
DELETE /api/attendances/:id
POST   /api/attendances/:id/approve
POST   /api/attendances/:id/reject

// ConfiguraÃ§Ãµes
GET    /api/config
PUT    /api/config

// RelatÃ³rios
GET    /api/reports/consolidated
GET    /api/reports/detailed
GET    /api/reports/export/pdf
GET    /api/reports/export/excel
```

## ðŸ§© Componentes Principais

### Layout
- Sidebar responsiva
- Header com busca e perfil
- Ãrea de conteÃºdo principal
- NavegaÃ§Ã£o baseada em role

### Cards de MÃ©tricas
- KPIs visuais
- Ãcones contextuais
- Cores por categoria
- AnimaÃ§Ãµes sutis

### Tabelas
- Responsivas (cards no mobile)
- OrdenaÃ§Ã£o e filtros
- PaginaÃ§Ã£o
- AÃ§Ãµes em linha

### FormulÃ¡rios
- ValidaÃ§Ã£o em tempo real
- Auto-complete de endereÃ§os (CEP)
- Feedback visual
- Estados de loading

## ðŸ“ˆ Performance

### OtimizaÃ§Ãµes
- Lazy loading de rotas
- MemoizaÃ§Ã£o de componentes pesados
- Virtual scrolling para listas grandes
- Debounce em buscas

### Bundle Size
- Tree shaking automÃ¡tico
- Code splitting por rota
- CompressÃ£o de assets

## ðŸ§ª Testing (Futuro)

### EstratÃ©gia Sugerida
```typescript
// Unit Tests
- Componentes individuais
- FunÃ§Ãµes de cÃ¡lculo
- Contextos

// Integration Tests
- Fluxos de usuÃ¡rio
- NavegaÃ§Ã£o entre pÃ¡ginas
- FormulÃ¡rios completos

// E2E Tests
- Login â†’ Dashboard
- Registro de presenÃ§a
- AprovaÃ§Ã£o de lanÃ§amentos
```

## ðŸ”§ ManutenÃ§Ã£o

### Adicionar Nova PÃ¡gina

1. Criar componente em `/src/app/pages/`
2. Adicionar rota em `/src/app/routes.ts`
3. Adicionar link na navegaÃ§Ã£o em `Layout.tsx`
4. Proteger com `ProtectedRoute` se necessÃ¡rio

### Adicionar Novo Tipo de UsuÃ¡rio

1. Atualizar `UserRole` em `AuthContext.tsx`
2. Adicionar permissÃµes em rotas
3. Criar pÃ¡ginas especÃ­ficas
4. Atualizar mock data

### Modificar Tema

1. Editar `/src/styles/theme.css`
2. Cores CSS variables auto-aplicadas
3. Tailwind usa as variÃ¡veis automaticamente

---

DocumentaÃ§Ã£o mantida em: 10/03/2026

