import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, MapPin, User, Building2, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api, type EmployeeResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LoadingState } from '../../components/LoadingState';
import { toast } from 'sonner';

const buildFormattedAddress = (formData: {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}) => `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city}/${formData.state}`;

const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const isExisting = !!id;
  const isEditRoute = window.location.pathname.endsWith('/edit');
  const isReadOnly = isExisting && !isEditRoute;
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(isExisting);

  const [formData, setFormData] = useState({
    role: 'employee',
    name: '',
    email: '',
    employeeId: '',
    team: '',
    status: 'active',
    password: '12345678',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    distanceToCompanyKm: '',
    distanceFromCompanyKm: '',
    valuePerKm: '0.85',
    month: '3',
    year: '2026'
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadEmployee = async () => {
      setIsInitialLoading(true);
      try {
        const response = await api.getEmployeeById(id);
        setEmployee(response);
        setFormData((current) => ({
          ...current,
          role: response.role,
          name: response.name,
          email: response.email,
          employeeId: response.employeeCode,
          team: response.department,
          status: response.active ? 'active' : 'inactive',
          cep: response.homeAddress?.zipCode ?? '',
          street: response.homeAddress?.street ?? '',
          number: response.homeAddress?.number ?? '',
          complement: response.homeAddress?.complement ?? '',
          neighborhood: response.homeAddress?.district ?? '',
          city: response.homeAddress?.city ?? '',
          state: response.homeAddress?.state ?? 'SP',
          distanceToCompanyKm: response.distanceToCompanyKm?.toString() ?? '',
          distanceFromCompanyKm: response.distanceFromCompanyKm?.toString() ?? '',
          valuePerKm: response.reimbursementPerKm?.toString() ?? '0.85',
          month: response.reimbursementRateMonth?.toString() ?? current.month,
          year: response.reimbursementRateYear?.toString() ?? current.year,
          password: ''
        }));
        setIsInitialLoading(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar o funcionario.');
        setIsInitialLoading(false);
      }
    };

    loadEmployee();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isReadOnly) {
      return;
    }

    if (
      !formData.name ||
      !formData.email ||
      !formData.employeeId ||
      !formData.team ||
      !formData.cep ||
      !formData.street ||
      !formData.number ||
      !formData.neighborhood ||
      !formData.city ||
      !formData.state ||
      !formData.distanceToCompanyKm ||
      !formData.distanceFromCompanyKm
    ) {
      toast.error('Preencha todos os campos obrigatorios.');
      return;
    }

    if (!isExisting && !formData.password) {
      toast.error('Defina a senha inicial do usuario.');
      return;
    }

    const distanceToCompanyKm = Number(formData.distanceToCompanyKm);
    const distanceFromCompanyKm = Number(formData.distanceFromCompanyKm);

    if (distanceToCompanyKm <= 0 || distanceFromCompanyKm <= 0) {
      toast.error('Informe distancias validas de ida e volta em km.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role as 'employee' | 'supervisor' | 'admin',
        active: formData.status === 'active',
        employeeCode: formData.employeeId,
        department: formData.team,
        supervisorId: formData.role === 'employee' ? user?.id ?? null : null,
        distanceToCompanyKm,
        distanceFromCompanyKm,
        password: formData.password || undefined,
        year: Number(formData.year),
        month: Number(formData.month),
        reimbursementPerKm: Number(formData.valuePerKm),
        address: {
          zipCode: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement || undefined,
          district: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          country: 'Brasil',
          formattedAddress: buildFormattedAddress(formData)
        }
      };

      if (isExisting && id) {
        await api.updateEmployee(id, payload);
        toast.success('Funcionario atualizado com sucesso.');
      } else {
        await api.createEmployee(payload);
        toast.success('Funcionario cadastrado com sucesso.');
      }

      navigate('/supervisor/employees');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isExisting
            ? 'Nao foi possivel atualizar o funcionario.'
            : 'Nao foi possivel cadastrar o funcionario.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isExisting && isInitialLoading) {
    return <LoadingState message="Carregando funcionario..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/supervisor/employees')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isExisting ? (isEditRoute ? 'Editar Funcionario' : 'Visualizar Funcionario') : 'Novo Funcionario'}
          </h1>
          <p className="text-muted-foreground">
            {isExisting ? 'Dados atuais do funcionario no banco.' : 'Cadastre um novo funcionario e defina o login inicial.'}
          </p>
        </div>
      </div>

      {isExisting && (
        <Card className="border-l-4 border-l-chart-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {isEditRoute
                ? 'Atualize os dados do funcionario e salve as alteracoes.'
                : 'Esta tela esta em modo consulta.'}
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>Informacoes basicas do funcionario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)} disabled={isReadOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Funcionario</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)} disabled={isReadOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" value={formData.name} onChange={(event) => handleChange('name', event.target.value)} disabled={isReadOnly} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(event) => handleChange('email', event.target.value)} disabled={isReadOnly} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Matricula *</Label>
                <Input id="employeeId" value={formData.employeeId} onChange={(event) => handleChange('employeeId', event.target.value)} disabled={isReadOnly} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Equipe *</Label>
                <Input id="team" value={formData.team} onChange={(event) => handleChange('team', event.target.value)} disabled={isReadOnly} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {!isExisting && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Login Inicial
              </CardTitle>
              <CardDescription>Defina a senha inicial que o novo usuario usara para entrar no sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input id="password" type="text" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuePerKm">R$/km *</Label>
                <Input id="valuePerKm" type="number" step="0.01" value={formData.valuePerKm} onChange={(event) => handleChange('valuePerKm', event.target.value)} required />
              </div>
            </CardContent>
          </Card>
        )}

        {isExisting && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Senha do Usuario
              </CardTitle>
              <CardDescription>Supervisor e admin podem definir uma nova senha quando necessario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="text" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} disabled={isReadOnly} placeholder="Deixe em branco para manter a senha atual" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Distancias do Trajeto
            </CardTitle>
            <CardDescription>Informe a quilometragem ja definida para ida e volta.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distanceToCompanyKm">Distancia ida (km) *</Label>
              <Input id="distanceToCompanyKm" type="number" min="0.01" step="0.01" value={formData.distanceToCompanyKm} onChange={(event) => handleChange('distanceToCompanyKm', event.target.value)} disabled={isReadOnly} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distanceFromCompanyKm">Distancia volta (km) *</Label>
              <Input id="distanceFromCompanyKm" type="number" min="0.01" step="0.01" value={formData.distanceFromCompanyKm} onChange={(event) => handleChange('distanceFromCompanyKm', event.target.value)} disabled={isReadOnly} required />
            </div>
          </CardContent>
        </Card>

        {isExisting && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Tarifa Atual
              </CardTitle>
              <CardDescription>Atualize a competencia e o valor por km do colaborador.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valuePerKm">R$/km *</Label>
                <Input id="valuePerKm" type="number" step="0.01" value={formData.valuePerKm} onChange={(event) => handleChange('valuePerKm', event.target.value)} disabled={isReadOnly} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Mes *</Label>
                <Input id="month" type="number" min="1" max="12" value={formData.month} onChange={(event) => handleChange('month', event.target.value)} disabled={isReadOnly} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Input id="year" type="number" min="2024" value={formData.year} onChange={(event) => handleChange('year', event.target.value)} disabled={isReadOnly} required />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereco Residencial
            </CardTitle>
            <CardDescription>Endereco usado no calculo da quilometragem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input id="cep" value={formData.cep} onChange={(event) => handleChange('cep', event.target.value)} disabled={isReadOnly} />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua *</Label>
                <Input id="street" value={formData.street} onChange={(event) => handleChange('street', event.target.value)} disabled={isReadOnly} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Numero *</Label>
                <Input id="number" value={formData.number} onChange={(event) => handleChange('number', event.target.value)} disabled={isReadOnly} />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" value={formData.complement} onChange={(event) => handleChange('complement', event.target.value)} disabled={isReadOnly} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input id="neighborhood" value={formData.neighborhood} onChange={(event) => handleChange('neighborhood', event.target.value)} disabled={isReadOnly} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" value={formData.city} onChange={(event) => handleChange('city', event.target.value)} disabled={isReadOnly} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input id="state" value={formData.state} onChange={(event) => handleChange('state', event.target.value)} disabled={isReadOnly} />
              </div>
            </div>
          </CardContent>
        </Card>

        {!isExisting && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Competencia Inicial
              </CardTitle>
              <CardDescription>Mes e ano da tarifa inicial do colaborador.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mes *</Label>
                <Input id="month" type="number" min="1" max="12" value={formData.month} onChange={(event) => handleChange('month', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Input id="year" type="number" min="2024" value={formData.year} onChange={(event) => handleChange('year', event.target.value)} required />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/supervisor/employees')}>
            Cancelar
          </Button>
          {!isExisting && (
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : 'Cadastrar Funcionario'}
            </Button>
          )}
          {isEditRoute && (
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : 'Salvar Alteracoes'}
            </Button>
          )}
        </div>
      </form>

      {employee && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Atual</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Perfil: {employee.role}</p>
            <p>Supervisor: {employee.supervisorName ?? 'Nao definido'}</p>
            <p>Ida: {employee.distanceToCompanyKm?.toFixed(2) ?? '-'} km</p>
            <p>Volta: {employee.distanceFromCompanyKm?.toFixed(2) ?? '-'} km</p>
            <p>R$/km: {employee.reimbursementPerKm?.toFixed(2) ?? '-'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeForm;
