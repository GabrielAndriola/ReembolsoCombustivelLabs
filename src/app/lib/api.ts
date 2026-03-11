export interface AuthUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'admin';
  employeeId: string;
  team?: string;
  supervisorName?: string | null;
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'admin';
  employeeCode: string | null;
  department: string | null;
  supervisorName: string | null;
  distanceToCompanyKm: number | null;
  distanceFromCompanyKm: number | null;
  totalDailyDistanceKm: number | null;
  company: {
    id: string;
    name: string;
  };
  companyAddress: AddressResponse | null;
  homeAddress: AddressResponse | null;
  monthlyRates: Array<{
    year: number;
    month: number;
    reimbursementPerKm: number;
  }>;
}

export interface AddressResponse {
  id: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
}

export interface UpdateCompanyAddressPayload {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress: string;
}

export interface PresenceResponse {
  id: string;
  presenceDate: string;
  observation?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  distanceOneWayKm: number;
  distanceRoundTripKm: number;
  reimbursementPerKmApplied: number;
  reimbursementAmount: number;
  calculatedAt: string;
}

export interface EmployeeResponse {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'admin';
  active: boolean;
  employeeCode: string;
  department: string;
  supervisorName: string | null;
  distanceToCompanyKm: number | null;
  distanceFromCompanyKm: number | null;
  totalDailyDistanceKm: number | null;
  reimbursementPerKm: number | null;
  reimbursementRateMonth?: number | null;
  reimbursementRateYear?: number | null;
  homeAddress: AddressResponse | null;
}

export interface MonthlyReportResponse {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  totalPresenceDays: number;
  totalDistanceKm: number;
  totalReimbursement: number;
  records: Array<{
    id: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    reimbursementAmount: number;
    reimbursementPerKmApplied: number;
  }>;
}

export interface EmployeeDashboardResponse {
  profile: ProfileResponse;
  presences: PresenceResponse[];
  summary: {
    totalPresenceDays: number;
    totalDistanceKm: number;
    totalReimbursement: number;
  };
}

export interface SupervisorOverviewResponse {
  employees: EmployeeResponse[];
  report: MonthlyReportResponse[];
}

export interface RateTargetResponse {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'admin';
  active: boolean;
  employeeCode: string;
  department: string;
  reimbursementPerKm: number | null;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'admin';
  active?: boolean;
  employeeCode: string;
  department: string;
  supervisorId?: string | null;
  distanceToCompanyKm: number;
  distanceFromCompanyKm: number;
  password?: string;
  year: number;
  month: number;
  reimbursementPerKm: number;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    formattedAddress: string;
  };
}

const STORAGE_TOKEN_KEY = 'km_presencial_token';
const STORAGE_USER_KEY = 'km_presencial_user';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const getToken = () => localStorage.getItem(STORAGE_TOKEN_KEY);

const request = async <T>(path: string, options: RequestInit = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Erro inesperado.' }));
    throw new Error(payload.message ?? 'Erro inesperado.');
  }

  return response.json() as Promise<T>;
};

export const authStorage = {
  getUser() {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  setSession(token: string, user: AuthUser) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }
};

export const api = {
  login(email: string, password: string) {
    return request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  me() {
    return request<AuthUser>('/api/auth/me');
  },

  getMyProfile() {
    return request<ProfileResponse>('/api/me/profile');
  },

  getMyDashboard(month: number, year: number) {
    return request<EmployeeDashboardResponse>(`/api/me/dashboard?month=${month}&year=${year}`);
  },

  getMyPresences(month: number, year: number) {
    return request<PresenceResponse[]>(`/api/me/presences?month=${month}&year=${year}`);
  },

  getMySummary(month: number, year: number) {
    return request<{
      totalPresenceDays: number;
      totalDistanceKm: number;
      totalReimbursement: number;
    }>(`/api/me/summary?month=${month}&year=${year}`);
  },

  createMyPresences(payload: { dates: string[]; observation?: string }) {
    return request<{ created: number }>('/api/me/presences', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getEmployees() {
    return request<EmployeeResponse[]>('/api/employees');
  },

  getEmployeeById(id: string) {
    return request<EmployeeResponse>(`/api/employees/${id}`);
  },

  getRateTargets() {
    return request<RateTargetResponse[]>('/api/employees/rate-targets');
  },

  createEmployee(payload: CreateEmployeePayload) {
    return request<{ id: string }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateEmployee(id: string, payload: CreateEmployeePayload) {
    return request<EmployeeResponse>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  applyRate(payload: {
    year: number;
    month: number;
    reimbursementPerKm: number;
    applyToAll: boolean;
    userIds?: string[];
  }) {
    return request<{ updated: number }>('/api/employees/rates/apply', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateCompanyAddress(payload: UpdateCompanyAddressPayload) {
    return request<AddressResponse>('/api/employees/company-address', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  getMonthlyReport(month: number, year: number) {
    return request<MonthlyReportResponse[]>(`/api/reports/monthly?month=${month}&year=${year}`);
  },

  getSupervisorOverview(month: number, year: number) {
    return request<SupervisorOverviewResponse>(`/api/reports/overview?month=${month}&year=${year}`);
  },

  updatePresenceStatus(id: string, status: 'approved' | 'rejected') {
    return request<{ updated: number }>(`/api/reports/presences/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  updateManyPresenceStatuses(ids: string[], status: 'approved' | 'rejected') {
    return request<{ updated: number }>('/api/reports/presences/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    });
  }
};
