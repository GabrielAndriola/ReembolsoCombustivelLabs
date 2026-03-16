// Mock data para a aplicacao Reembolso Combustivel Labs

export interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  team: string;
  supervisor: string;
  status: 'active' | 'inactive';
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  distanceToCompanyKm?: number;
  distanceFromCompanyKm?: number;
  kmPerDay: number;
  valuePerKm: number;
  avatar?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  kmTraveled: number;
  value: number;
  observation?: string;
}

export interface CompanyConfig {
  name: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  defaultValuePerKm: number;
  editWindowDays: number;
  requireApproval: boolean;
}

export const mockCompanyConfig: CompanyConfig = {
  name: 'TechCorp Brasil',
  address: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1578',
    complement: '5º andar',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP'
  },
  defaultValuePerKm: 0.85,
  editWindowDays: 5,
  requireApproval: true
};

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria.santos@crisdu.com.br',
    employeeId: 'EMP042',
    team: 'Comercial',
    supervisor: 'Carlos Silva',
    status: 'active',
    address: {
      cep: '04567-000',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP'
    },
    kmPerDay: 24,
    valuePerKm: 0.85,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
  },
  {
    id: '2',
    name: 'João Oliveira',
    email: 'joao.oliveira@crisdu.com.br',
    employeeId: 'EMP087',
    team: 'TI',
    supervisor: 'Carlos Silva',
    status: 'active',
    address: {
      cep: '05432-100',
      street: 'Rua Augusta',
      number: '456',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP'
    },
    kmPerDay: 18,
    valuePerKm: 0.85,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao'
  },
  {
    id: '3',
    name: 'Ana Paula Costa',
    email: 'ana.costa@crisdu.com.br',
    employeeId: 'EMP015',
    team: 'RH',
    supervisor: 'Carlos Silva',
    status: 'active',
    address: {
      cep: '03456-200',
      street: 'Avenida Ipiranga',
      number: '789',
      neighborhood: 'República',
      city: 'São Paulo',
      state: 'SP'
    },
    kmPerDay: 32,
    valuePerKm: 0.85,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
  },
  {
    id: '4',
    name: 'Pedro Henrique Lima',
    email: 'pedro.lima@crisdu.com.br',
    employeeId: 'EMP098',
    team: 'Financeiro',
    supervisor: 'Carlos Silva',
    status: 'active',
    address: {
      cep: '02345-678',
      street: 'Rua Oscar Freire',
      number: '321',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP'
    },
    kmPerDay: 28,
    valuePerKm: 0.85,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro'
  },
  {
    id: '5',
    name: 'Juliana Ferreira',
    email: 'juliana.ferreira@crisdu.com.br',
    employeeId: 'EMP056',
    team: 'Marketing',
    supervisor: 'Carlos Silva',
    status: 'active',
    address: {
      cep: '01234-567',
      street: 'Rua da Consolação',
      number: '654',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP'
    },
    kmPerDay: 22,
    valuePerKm: 0.85,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana'
  },
  {
    id: '6',
    name: 'Rafael Mendes',
    email: 'rafael.mendes@crisdu.com.br',
    employeeId: 'EMP073',
    team: 'TI',
    supervisor: 'Carlos Silva',
    status: 'inactive',
    address: {
      cep: '04321-876',
      street: 'Avenida Rebouças',
      number: '987',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP'
    },
    kmPerDay: 16,
    valuePerKm: 0.85,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael'
  }
];

// Gerar registros de presença para março de 2026
export const mockAttendances: Attendance[] = [
  // Maria Santos (EMP042)
  { id: 'att1', employeeId: '1', date: '2026-03-03', status: 'approved', kmTraveled: 24, value: 20.4, observation: 'Reunião com cliente' },
  { id: 'att2', employeeId: '1', date: '2026-03-04', status: 'approved', kmTraveled: 24, value: 20.4 },
  { id: 'att3', employeeId: '1', date: '2026-03-05', status: 'approved', kmTraveled: 24, value: 20.4 },
  { id: 'att4', employeeId: '1', date: '2026-03-06', status: 'pending', kmTraveled: 24, value: 20.4 },
  { id: 'att5', employeeId: '1', date: '2026-03-09', status: 'pending', kmTraveled: 24, value: 20.4 },
  
  // João Oliveira (EMP087)
  { id: 'att6', employeeId: '2', date: '2026-03-02', status: 'approved', kmTraveled: 18, value: 15.3 },
  { id: 'att7', employeeId: '2', date: '2026-03-03', status: 'approved', kmTraveled: 18, value: 15.3 },
  { id: 'att8', employeeId: '2', date: '2026-03-05', status: 'approved', kmTraveled: 18, value: 15.3 },
  { id: 'att9', employeeId: '2', date: '2026-03-06', status: 'pending', kmTraveled: 18, value: 15.3 },
  
  // Ana Paula Costa (EMP015)
  { id: 'att10', employeeId: '3', date: '2026-03-02', status: 'approved', kmTraveled: 32, value: 27.2 },
  { id: 'att11', employeeId: '3', date: '2026-03-03', status: 'approved', kmTraveled: 32, value: 27.2 },
  { id: 'att12', employeeId: '3', date: '2026-03-04', status: 'approved', kmTraveled: 32, value: 27.2 },
  { id: 'att13', employeeId: '3', date: '2026-03-05', status: 'approved', kmTraveled: 32, value: 27.2 },
  { id: 'att14', employeeId: '3', date: '2026-03-06', status: 'pending', kmTraveled: 32, value: 27.2 },
  { id: 'att15', employeeId: '3', date: '2026-03-09', status: 'pending', kmTraveled: 32, value: 27.2 },
  
  // Pedro Henrique Lima (EMP098)
  { id: 'att16', employeeId: '4', date: '2026-03-03', status: 'approved', kmTraveled: 28, value: 23.8 },
  { id: 'att17', employeeId: '4', date: '2026-03-04', status: 'approved', kmTraveled: 28, value: 23.8 },
  { id: 'att18', employeeId: '4', date: '2026-03-05', status: 'approved', kmTraveled: 28, value: 23.8 },
  
  // Juliana Ferreira (EMP056)
  { id: 'att19', employeeId: '5', date: '2026-03-02', status: 'approved', kmTraveled: 22, value: 18.7 },
  { id: 'att20', employeeId: '5', date: '2026-03-03', status: 'approved', kmTraveled: 22, value: 18.7 },
  { id: 'att21', employeeId: '5', date: '2026-03-04', status: 'approved', kmTraveled: 22, value: 18.7 },
  { id: 'att22', employeeId: '5', date: '2026-03-05', status: 'approved', kmTraveled: 22, value: 18.7 },
  { id: 'att23', employeeId: '5', date: '2026-03-06', status: 'pending', kmTraveled: 22, value: 18.7 },
  { id: 'att24', employeeId: '5', date: '2026-03-09', status: 'pending', kmTraveled: 22, value: 18.7 },
];
