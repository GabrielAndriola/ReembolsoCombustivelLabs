import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, MapPin, User, Building2, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api, type EmployeeResponse } from '../../lib/api';
import {
  buildFormattedAddress,
  fetchAddressByCep,
  fetchCitiesByState,
  fetchNeighborhoodsByAddress,
  fetchStates,
  mergeUniqueStrings,
  sanitizeCep,
  type CityOption,
  type StateOption
} from '../../lib/addressLookup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LoadingState } from '../../components/LoadingState';
import { toast } from 'sonner';

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
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const lastResolvedCepRef = useRef('');
  const cepLookupInFlightRef = useRef<string | null>(null);

  const [formData, setFormData] = useState({
    role: 'employee',
    name: '',
    email: '',
    employeeId: '',
    team: '',
    status: 'active',
    password: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    distanceToCompanyKm: '',
    distanceFromCompanyKm: '',
    valuePerKm: '0.65'
  });

  const stateOptions = useMemo(() => {
    if (!formData.state) {
      return states;
    }

    const hasCurrentState = states.some((state) => state.abbreviation === formData.state);
    return hasCurrentState
      ? states
      : [...states, { id: -1, abbreviation: formData.state, name: formData.state }];
  }, [formData.state, states]);

  const cityOptions = useMemo(() => {
    if (!formData.city) {
      return cities;
    }

    const hasCurrentCity = cities.some((city) => city.name === formData.city);
    return hasCurrentCity ? cities : [...cities, { id: -1, name: formData.city }];
  }, [cities, formData.city]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        setStates(await fetchStates());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar os estados.');
      }
    };

    loadStates();
  }, []);

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
          valuePerKm: response.reimbursementPerKm?.toString() ?? '0.65',
          password: ''
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar o funcionario.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadEmployee();
  }, [id]);

  useEffect(() => {
    if (!formData.state) {
      setCities([]);
      return;
    }

    let cancelled = false;

    const loadCities = async () => {
      try {
        const nextCities = await fetchCitiesByState(formData.state);

        if (!cancelled) {
          setCities(nextCities);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar as cidades.');
        }
      }
    };

    loadCities();

    return () => {
      cancelled = true;
    };
  }, [formData.state]);

  useEffect(() => {
    const currentNeighborhood = formData.neighborhood;

    if (!formData.state || !formData.city || formData.street.trim().length < 3) {
      setNeighborhoodOptions(mergeUniqueStrings([currentNeighborhood]));
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const neighborhoods = await fetchNeighborhoodsByAddress({
          state: formData.state,
          city: formData.city,
          street: formData.street
        });

        if (!cancelled) {
          setNeighborhoodOptions(mergeUniqueStrings([currentNeighborhood, ...neighborhoods]));
        }
      } catch {
        if (!cancelled) {
          setNeighborhoodOptions(mergeUniqueStrings([currentNeighborhood]));
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [formData.city, formData.neighborhood, formData.state, formData.street]);

  const handleChange = (field: string, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: field === 'cep' ? sanitizeCep(value) : value
    }));
  };

  const handleStateChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      state: value,
      city: current.state === value ? current.city : '',
      neighborhood: current.state === value ? current.neighborhood : ''
    }));
  };

  const handleCityChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      city: value,
      neighborhood: current.city === value ? current.neighborhood : ''
    }));
  };

  const lookupCep = async (cepValue: string) => {
    const sanitizedCep = sanitizeCep(cepValue);

    if (
      sanitizedCep.length !== 8 ||
      cepLookupInFlightRef.current === sanitizedCep ||
      lastResolvedCepRef.current === sanitizedCep
    ) {
      return;
    }

    cepLookupInFlightRef.current = sanitizedCep;
    setIsLookingUpCep(true);

    try {
      const address = await fetchAddressByCep(sanitizedCep);
      const nextState = address.state || formData.state;
      const nextCity = address.city || formData.city;
      const nextNeighborhood = address.neighborhood || formData.neighborhood;

      setFormData((current) => ({
        ...current,
        cep: sanitizeCep(address.zipCode),
        street: address.street || current.street,
        complement: current.complement || address.complement,
        neighborhood: nextNeighborhood,
        city: nextCity,
        state: nextState
      }));
      setNeighborhoodOptions((current) => mergeUniqueStrings([nextNeighborhood, ...current]));
      lastResolvedCepRef.current = sanitizedCep;

      if (nextState) {
        const nextCities = await fetchCitiesByState(nextState);
        setCities(nextCities);
      } else {
        setCities([]);
      }

      if (nextState && nextCity && (address.street || formData.street).trim().length >= 3) {
        const nextNeighborhoods = await fetchNeighborhoodsByAddress({
          state: nextState,
          city: nextCity,
          street: address.street || formData.street
        });
        setNeighborhoodOptions((current) => mergeUniqueStrings([nextNeighborhood, ...nextNeighborhoods, ...current]));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel buscar o CEP.');
    } finally {
      if (cepLookupInFlightRef.current === sanitizedCep) {
        cepLookupInFlightRef.current = null;
      }
      setIsLookingUpCep(false);
    }
  };

  useEffect(() => {
    const sanitizedCep = sanitizeCep(formData.cep);

    if (sanitizedCep.length !== 8) {
      lastResolvedCepRef.current = '';
      return;
    }

    void lookupCep(sanitizedCep);
  }, [formData.cep]);

  const handleCepBlur = async () => {
    await lookupCep(formData.cep);
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
        reimbursementPerKm: Number(formData.valuePerKm),
        address: {
          zipCode: sanitizeCep(formData.cep),
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
                <Input id="password" type="password" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} required />
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
              <Input id="password" type="password" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} disabled={isReadOnly} placeholder="Deixe em branco para manter a senha atual" />
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
              <CardDescription>Atualize o valor por km do colaborador.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valuePerKm">R$/km *</Label>
                <Input id="valuePerKm" type="number" step="0.01" value={formData.valuePerKm} onChange={(event) => handleChange('valuePerKm', event.target.value)} disabled={isReadOnly} required />
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
                <Input id="cep" value={formData.cep} onChange={(event) => handleChange('cep', event.target.value)} onBlur={handleCepBlur} disabled={isReadOnly || isLookingUpCep} />
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
                <Label htmlFor="state">Estado *</Label>
                <Select value={formData.state} onValueChange={handleStateChange} disabled={isReadOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateOptions.map((state) => (
                      <SelectItem key={state.abbreviation} value={state.abbreviation}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" list="employee-city-options" value={formData.city} onChange={(event) => handleCityChange(event.target.value)} disabled={isReadOnly || !formData.state} />
                <datalist id="employee-city-options">
                  {cityOptions.map((city) => (
                    <option key={`${city.id}-${city.name}`} value={city.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input id="neighborhood" list="employee-neighborhood-options" value={formData.neighborhood} onChange={(event) => handleChange('neighborhood', event.target.value)} disabled={isReadOnly} />
                <datalist id="employee-neighborhood-options">
                  {neighborhoodOptions.map((neighborhood) => (
                    <option key={neighborhood} value={neighborhood} />
                  ))}
                </datalist>
              </div>
            </div>
          </CardContent>
        </Card>

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





