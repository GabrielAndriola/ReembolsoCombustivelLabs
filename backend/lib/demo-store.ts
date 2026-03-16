type DemoRole = 'admin' | 'supervisor' | 'employee';
type DemoStatus = 'pending' | 'approved' | 'rejected';

interface DemoAddress {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface DemoUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: DemoRole;
  employeeId: string;
  team: string;
  supervisorName: string | null;
  password: string;
  homeAddress?: DemoAddress;
}

interface DemoPresence {
  id: string;
  employeeUserId: string;
  presenceDate: string;
  observation?: string;
  status: DemoStatus;
  distanceOneWayKm: number;
  distanceRoundTripKm: number;
  reimbursementPerKmApplied: number;
  reimbursementAmount: number;
  calculatedAt: string;
}

const company = {
  id: 'company-1',
  name: 'TechCorp Brasil',
  address: {
    zipCode: '01310-100',
    street: 'Avenida Paulista',
    number: '1578',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    latitude: -23.5613991,
    longitude: -46.6565712,
    formattedAddress: 'Avenida Paulista, 1578 - Bela Vista, São Paulo/SP'
  }
};

const users: DemoUser[] = [
  {
    id: 'admin-1',
    companyId: company.id,
    name: 'Admin KM',
    email: 'admin@crisdu.com.br',
    role: 'admin',
    employeeId: 'ADM001',
    team: 'Administração',
    supervisorName: null,
    password: '12345678'
  },
  {
    id: 'supervisor-1',
    companyId: company.id,
    name: 'Carlos Silva',
    email: 'supervisor@crisdu.com.br',
    role: 'supervisor',
    employeeId: 'SUP001',
    team: 'Gestão',
    supervisorName: null,
    password: '12345678',
    homeAddress: {
      zipCode: '01414-002',
      street: 'Rua Haddock Lobo',
      number: '595',
      district: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      latitude: -23.5602322,
      longitude: -46.6667068,
      formattedAddress: 'Rua Haddock Lobo, 595 - Cerqueira César, São Paulo/SP'
    }
  },
  {
    id: 'employee-1',
    companyId: company.id,
    name: 'Maria Santos',
    email: 'maria.santos@crisdu.com.br',
    role: 'employee',
    employeeId: 'EMP042',
    team: 'Comercial',
    supervisorName: 'Carlos Silva',
    password: '12345678',
    homeAddress: {
      zipCode: '04101-300',
      street: 'Rua das Flores',
      number: '123',
      district: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      latitude: -23.5893917,
      longitude: -46.6340278,
      formattedAddress: 'Rua das Flores, 123 - Vila Mariana, São Paulo/SP'
    }
  },
  {
    id: 'employee-2',
    companyId: company.id,
    name: 'João Oliveira',
    email: 'joao.oliveira@crisdu.com.br',
    role: 'employee',
    employeeId: 'EMP087',
    team: 'TI',
    supervisorName: 'Carlos Silva',
    password: '12345678',
    homeAddress: {
      zipCode: '05432-000',
      street: 'Rua Augusta',
      number: '456',
      district: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      latitude: -23.5557714,
      longitude: -46.6629868,
      formattedAddress: 'Rua Augusta, 456 - Consolação, São Paulo/SP'
    }
  },
  {
    id: 'employee-3',
    companyId: company.id,
    name: 'Ana Paula Costa',
    email: 'ana.costa@crisdu.com.br',
    role: 'employee',
    employeeId: 'EMP015',
    team: 'RH',
    supervisorName: 'Carlos Silva',
    password: '12345678',
    homeAddress: {
      zipCode: '01046-010',
      street: 'Avenida Ipiranga',
      number: '789',
      district: 'República',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      latitude: -23.5440506,
      longitude: -46.6452361,
      formattedAddress: 'Avenida Ipiranga, 789 - República, São Paulo/SP'
    }
  }
];

const monthlyRates = [
  { employeeUserId: 'employee-1', year: 2026, month: 3, reimbursementPerKm: 0.85 },
  { employeeUserId: 'employee-2', year: 2026, month: 3, reimbursementPerKm: 0.92 },
  { employeeUserId: 'employee-3', year: 2026, month: 3, reimbursementPerKm: 0.88 },
  { employeeUserId: 'supervisor-1', year: 2026, month: 3, reimbursementPerKm: 0.95 }
];

const presences: DemoPresence[] = [
  {
    id: 'presence-1',
    employeeUserId: 'employee-1',
    presenceDate: '2026-03-03',
    observation: 'Registro inicial do seed',
    status: 'approved',
    distanceOneWayKm: 3.73,
    distanceRoundTripKm: 7.46,
    reimbursementPerKmApplied: 0.85,
    reimbursementAmount: 6.34,
    calculatedAt: new Date().toISOString()
  },
  {
    id: 'presence-2',
    employeeUserId: 'employee-1',
    presenceDate: '2026-03-04',
    observation: 'Registro inicial do seed',
    status: 'approved',
    distanceOneWayKm: 3.73,
    distanceRoundTripKm: 7.46,
    reimbursementPerKmApplied: 0.85,
    reimbursementAmount: 6.34,
    calculatedAt: new Date().toISOString()
  },
  {
    id: 'presence-3',
    employeeUserId: 'employee-1',
    presenceDate: '2026-03-06',
    observation: 'Registro inicial do seed',
    status: 'pending',
    distanceOneWayKm: 3.73,
    distanceRoundTripKm: 7.46,
    reimbursementPerKmApplied: 0.85,
    reimbursementAmount: 6.34,
    calculatedAt: new Date().toISOString()
  }
];

export const demoStore = {
  company,
  users,
  monthlyRates,
  presences,
  findUserByEmail(email: string) {
    return users.find((user) => user.email === email.toLowerCase()) ?? null;
  },
  findUserById(id: string) {
    return users.find((user) => user.id === id) ?? null;
  },
  getRate(userId: string, month: number, year: number) {
    return monthlyRates.find((rate) => rate.employeeUserId === userId && rate.month === month && rate.year === year) ?? null;
  },
  getPresences(userId: string, month: number, year: number) {
    return presences.filter((presence) => {
      const date = new Date(`${presence.presenceDate}T00:00:00`);
      return presence.employeeUserId === userId && date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  },
  addPresences(records: DemoPresence[]) {
    presences.push(...records);
  }
};
