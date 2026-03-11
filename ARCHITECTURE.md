# Arquitetura do Projeto Reembolso Combustivel Labs

## 📁 Estrutura de Diretórios

```
src/
├── app/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (shadcn/ui)
│   │   ├── Layout.tsx      # Layout principal com sidebar
│   │   ├── EmptyState.tsx  # Estado vazio
│   │   ├── LoadingState.tsx # Estado de carregamento
│   │   └── ...             # Outros componentes
│   ├── contexts/           # Contextos React
│   │   └── AuthContext.tsx # Gerenciamento de autenticação
│   ├── lib/                # Utilitários e dados
│   │   └── mock-data.ts    # Dados de demonstração
│   ├── pages/              # Páginas da aplicação
│   │   ├── employee/       # Páginas do funcionário
│   │   ├── supervisor/     # Páginas do supervisor
│   │   ├── Login.tsx       # Página de login
│   │   └── NotFound.tsx    # Página 404
│   ├── App.tsx             # Componente raiz
│   └── routes.ts           # Configuração de rotas
└── styles/                 # Estilos globais
    ├── theme.css           # Tokens de design
    ├── tailwind.css        # Importação do Tailwind
    └── index.css           # Estilos globais
```

## 🔄 Fluxo de Dados

### Autenticação
1. **AuthContext** gerencia o estado global de autenticação
2. Armazena usuário no localStorage para persistência
3. **ProtectedRoute** protege rotas baseado em autenticação e role

### Navegação
1. **React Router Data Mode** gerencia navegação
2. Rotas separadas por perfil (employee/supervisor)
3. Redirecionamento automático baseado em permissões

### Dados Mock
- Armazenados em `mock-data.ts`
- Simula funcionários, registros e configurações
- Pronto para ser substituído por chamadas de API

## 🎨 Sistema de Design

### Cores
Definidas em `/src/styles/theme.css`:
- `--primary`: Azul principal (#2563EB)
- `--secondary`: Azul escuro (#0F172A)
- `--accent`: Teal (#14B8A6)
- `--background`: Cinza claro (#F8FAFC)

### Componentes Base
Utilizamos **Radix UI** + **Tailwind CSS**:
- Acessíveis por padrão
- Totalmente customizáveis
- Compatíveis com temas

## 📱 Responsividade

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Estratégia Mobile-First
1. Layout mobile por padrão
2. Melhorias progressivas para desktop
3. Sidebar responsiva (hamburguer no mobile)

## 🔐 Autenticação e Autorização

### Tipos de Usuário
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

### Proteção de Rotas
```typescript
<ProtectedRoute requiredRole="supervisor">
  <Layout />
</ProtectedRoute>
```

## 📊 Cálculo de Reembolso

### Fórmula Base
```
Valor do Dia = Distância (km) × Valor por KM
```

### Variáveis
- **Distância**: Ida + Volta (configurável por funcionário)
- **Valor por KM**: R$ 0.85 (padrão, customizável)

### Exemplo
```
Funcionário mora a 12km da empresa
Distância diária = 12km × 2 (ida e volta) = 24km
Valor por dia = 24km × R$ 0.85 = R$ 20.40
```

## 🎯 Funcionalidades por Perfil

### Funcionário
- ✅ Dashboard pessoal
- ✅ Registrar presença
- ✅ Visualizar histórico próprio
- ✅ Calendário de presenças
- ❌ Ver outros funcionários
- ❌ Configurações do sistema

### Supervisor
- ✅ Dashboard gerencial
- ✅ Visualizar todos os registros
- ✅ Gerenciar funcionários
- ✅ Aprovar/rejeitar lançamentos
- ✅ Configurar sistema
- ✅ Exportar relatórios
- ✅ Gráficos e análises

## 🚀 Integração Futura (Backend)

### Endpoints Sugeridos

```typescript
// Autenticação
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// Funcionários
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

// Registros de Presença
GET    /api/attendances
GET    /api/attendances/:id
POST   /api/attendances
PUT    /api/attendances/:id
DELETE /api/attendances/:id
POST   /api/attendances/:id/approve
POST   /api/attendances/:id/reject

// Configurações
GET    /api/config
PUT    /api/config

// Relatórios
GET    /api/reports/consolidated
GET    /api/reports/detailed
GET    /api/reports/export/pdf
GET    /api/reports/export/excel
```

## 🧩 Componentes Principais

### Layout
- Sidebar responsiva
- Header com busca e perfil
- Área de conteúdo principal
- Navegação baseada em role

### Cards de Métricas
- KPIs visuais
- Ícones contextuais
- Cores por categoria
- Animações sutis

### Tabelas
- Responsivas (cards no mobile)
- Ordenação e filtros
- Paginação
- Ações em linha

### Formulários
- Validação em tempo real
- Auto-complete de endereços (CEP)
- Feedback visual
- Estados de loading

## 📈 Performance

### Otimizações
- Lazy loading de rotas
- Memoização de componentes pesados
- Virtual scrolling para listas grandes
- Debounce em buscas

### Bundle Size
- Tree shaking automático
- Code splitting por rota
- Compressão de assets

## 🧪 Testing (Futuro)

### Estratégia Sugerida
```typescript
// Unit Tests
- Componentes individuais
- Funções de cálculo
- Contextos

// Integration Tests
- Fluxos de usuário
- Navegação entre páginas
- Formulários completos

// E2E Tests
- Login → Dashboard
- Registro de presença
- Aprovação de lançamentos
```

## 🔧 Manutenção

### Adicionar Nova Página

1. Criar componente em `/src/app/pages/`
2. Adicionar rota em `/src/app/routes.ts`
3. Adicionar link na navegação em `Layout.tsx`
4. Proteger com `ProtectedRoute` se necessário

### Adicionar Novo Tipo de Usuário

1. Atualizar `UserRole` em `AuthContext.tsx`
2. Adicionar permissões em rotas
3. Criar páginas específicas
4. Atualizar mock data

### Modificar Tema

1. Editar `/src/styles/theme.css`
2. Cores CSS variables auto-aplicadas
3. Tailwind usa as variáveis automaticamente

---

Documentação mantida em: 10/03/2026
