import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, DollarSign, Settings as SettingsIcon, Shield, CheckSquare } from 'lucide-react';
import { api, type ProfileResponse, type RateTargetResponse } from '../../lib/api';
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
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LoadingState } from '../../components/LoadingState';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [targets, setTargets] = useState<RateTargetResponse[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [valuePerKm, setValuePerKm] = useState('0.65');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCompanyAddress, setIsSavingCompanyAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const lastResolvedCepRef = useRef('');
  const cepLookupInFlightRef = useRef<string | null>(null);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);
  const [companyAddress, setCompanyAddress] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    country: 'Brasil',
    latitude: '',
    longitude: '',
    formattedAddress: ''
  });

  const stateOptions = useMemo(() => {
    if (!companyAddress.state) {
      return states;
    }

    const hasCurrentState = states.some((state) => state.abbreviation === companyAddress.state);
    return hasCurrentState
      ? states
      : [...states, { id: -1, abbreviation: companyAddress.state, name: companyAddress.state }];
  }, [companyAddress.state, states]);

  const cityOptions = useMemo(() => {
    if (!companyAddress.city) {
      return cities;
    }

    const hasCurrentCity = cities.some((city) => city.name === companyAddress.city);
    return hasCurrentCity ? cities : [...cities, { id: -1, name: companyAddress.city }];
  }, [cities, companyAddress.city]);

  const syncFormattedAddress = (address: typeof companyAddress) => ({
    ...address,
    formattedAddress: buildFormattedAddress({
      street: address.street,
      number: address.number,
      neighborhood: address.district,
      city: address.city,
      state: address.state
    })
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileResponse, targetsResponse] = await Promise.all([
        api.getMyProfile(),
        api.getRateTargets()
      ]);
      const selectedRate = profileResponse.monthlyRates[0]?.reimbursementPerKm ?? 0;

      setProfile(profileResponse);
      setTargets(targetsResponse);
      setValuePerKm(selectedRate > 0 ? selectedRate.toFixed(2) : '');
      setCompanyAddress(syncFormattedAddress({
        zipCode: profileResponse.companyAddress?.zipCode ?? '',
        street: profileResponse.companyAddress?.street ?? '',
        number: profileResponse.companyAddress?.number ?? '',
        complement: profileResponse.companyAddress?.complement ?? '',
        district: profileResponse.companyAddress?.district ?? '',
        city: profileResponse.companyAddress?.city ?? '',
        state: profileResponse.companyAddress?.state ?? '',
        country: profileResponse.companyAddress?.country ?? 'Brasil',
        latitude: profileResponse.companyAddress?.latitude?.toString() ?? '',
        longitude: profileResponse.companyAddress?.longitude?.toString() ?? '',
        formattedAddress: profileResponse.companyAddress?.formattedAddress ?? ''
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar as configuracoes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadStates = async () => {
      try {
        setStates(await fetchStates());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar os estados.');
      }
    };

    loadStates();
    loadData();
  }, []);

  useEffect(() => {
    if (!companyAddress.state) {
      setCities([]);
      return;
    }

    let cancelled = false;

    const loadCities = async () => {
      try {
        const nextCities = await fetchCitiesByState(companyAddress.state);

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
  }, [companyAddress.state]);

  useEffect(() => {
    const currentNeighborhood = companyAddress.district;

    if (!companyAddress.state || !companyAddress.city || companyAddress.street.trim().length < 3) {
      setNeighborhoodOptions(mergeUniqueStrings([currentNeighborhood]));
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const neighborhoods = await fetchNeighborhoodsByAddress({
          state: companyAddress.state,
          city: companyAddress.city,
          street: companyAddress.street
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
  }, [companyAddress.city, companyAddress.district, companyAddress.state, companyAddress.street]);

  const currentRate = profile?.monthlyRates[0]?.reimbursementPerKm ?? 0;

  const selectedCount = useMemo(
    () => (applyToAll ? targets.length : selectedIds.length),
    [applyToAll, selectedIds.length, targets.length]
  );

  const toggleTarget = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleApplyRate = async () => {
    const reimbursementPerKm = Number(valuePerKm);

    if (reimbursementPerKm <= 0) {
      toast.error('Informe um valor por km valido.');
      return;
    }

    if (!applyToAll && selectedIds.length === 0) {
      toast.error('Selecione pelo menos um usuario para aplicar a nova tarifa.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await api.applyRate({
        reimbursementPerKm,
        applyToAll,
        userIds: applyToAll ? undefined : selectedIds
      });
      setValuePerKm(reimbursementPerKm.toFixed(2));
      toast.success(`Tarifa aplicada para ${result.updated} usuario(s).`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel aplicar a nova tarifa.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCompanyAddressField = (field: keyof typeof companyAddress, value: string) => {
    setCompanyAddress((current) => {
      const next = {
        ...current,
        [field]: field === 'zipCode' ? sanitizeCep(value) : value
      };

      if (field === 'street' || field === 'number' || field === 'district' || field === 'city' || field === 'state') {
        return syncFormattedAddress(next);
      }

      return next;
    });
  };

  const handleStateChange = (value: string) => {
    setCompanyAddress((current) => syncFormattedAddress({
      ...current,
      state: value,
      city: current.state === value ? current.city : '',
      district: current.state === value ? current.district : ''
    }));
  };

  const handleCityChange = (value: string) => {
    setCompanyAddress((current) => syncFormattedAddress({
      ...current,
      city: value,
      district: current.city === value ? current.district : ''
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
      const nextState = address.state || companyAddress.state;
      const nextCity = address.city || companyAddress.city;
      const nextDistrict = address.neighborhood || companyAddress.district;

      setCompanyAddress((current) => syncFormattedAddress({
        ...current,
        zipCode: sanitizeCep(address.zipCode),
        street: address.street || current.street,
        complement: current.complement || address.complement,
        district: nextDistrict,
        city: nextCity,
        state: nextState
      }));
      setNeighborhoodOptions((current) => mergeUniqueStrings([nextDistrict, ...current]));
      lastResolvedCepRef.current = sanitizedCep;

      if (nextState) {
        const nextCities = await fetchCitiesByState(nextState);
        setCities(nextCities);
      } else {
        setCities([]);
      }

      if (nextState && nextCity && (address.street || companyAddress.street).trim().length >= 3) {
        const nextNeighborhoods = await fetchNeighborhoodsByAddress({
          state: nextState,
          city: nextCity,
          street: address.street || companyAddress.street
        });
        setNeighborhoodOptions((current) => mergeUniqueStrings([nextDistrict, ...nextNeighborhoods, ...current]));
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
    const sanitizedCep = sanitizeCep(companyAddress.zipCode);

    if (sanitizedCep.length !== 8) {
      lastResolvedCepRef.current = '';
      return;
    }

    void lookupCep(sanitizedCep);
  }, [companyAddress.zipCode]);

  const handleCepBlur = async () => {
    await lookupCep(companyAddress.zipCode);
  };

  const handleSaveCompanyAddress = async () => {
    if (
      !companyAddress.zipCode ||
      !companyAddress.street ||
      !companyAddress.number ||
      !companyAddress.district ||
      !companyAddress.city ||
      !companyAddress.state
    ) {
      toast.error('Preencha os campos obrigatorios do endereco da empresa.');
      return;
    }

    setIsSavingCompanyAddress(true);

    try {
      await api.updateCompanyAddress({
        zipCode: sanitizeCep(companyAddress.zipCode),
        street: companyAddress.street,
        number: companyAddress.number,
        complement: companyAddress.complement || undefined,
        district: companyAddress.district,
        city: companyAddress.city,
        state: companyAddress.state,
        country: companyAddress.country || 'Brasil',
        latitude: companyAddress.latitude ? Number(companyAddress.latitude) : null,
        longitude: companyAddress.longitude ? Number(companyAddress.longitude) : null,
        formattedAddress: buildFormattedAddress({
          street: companyAddress.street,
          number: companyAddress.number,
          neighborhood: companyAddress.district,
          city: companyAddress.city,
          state: companyAddress.state
        })
      });
      toast.success('Endereco da empresa atualizado.');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o endereco da empresa.');
    } finally {
      setIsSavingCompanyAddress(false);
    }
  };

  if (isLoading && !profile) {
    return <LoadingState message="Carregando configuracoes..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie tarifa de reembolso e informacoes atuais do ambiente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Definir R$/km
          </CardTitle>
          <CardDescription>Supervisor e admin podem aplicar uma nova tarifa para usuarios selecionados ou para todos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">R$/km</label>
              <Input type="number" min="0.01" step="0.01" value={valuePerKm} onChange={(event) => setValuePerKm(event.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox id="applyToAll" checked={applyToAll} onCheckedChange={(checked) => setApplyToAll(Boolean(checked))} />
            <label htmlFor="applyToAll" className="text-sm text-foreground">
              Aplicar para todos os usuarios da empresa
            </label>
          </div>

          {!applyToAll && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckSquare className="w-4 h-4" />
                {selectedIds.length} usuario(s) selecionado(s)
              </div>
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                {targets.map((target) => (
                  <label key={target.id} className="flex items-center justify-between gap-4 p-3 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedIds.includes(target.id)} onCheckedChange={() => toggleTarget(target.id)} />
                      <div>
                        <div className="font-medium text-foreground">{target.name}</div>
                        <div className="text-xs text-muted-foreground">{target.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-foreground">{target.role}</div>
                      <div className="text-xs text-muted-foreground">Atual: R$ {target.reimbursementPerKm?.toFixed(2) ?? '0.00'}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleApplyRate} disabled={isSaving || selectedCount === 0} className="gap-2">
              <DollarSign className="w-4 h-4" />
              {isSaving ? 'Aplicando...' : `Aplicar para ${selectedCount} usuario(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Empresa
          </CardTitle>
          <CardDescription>Supervisor e admin podem ajustar o endereco principal da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {profile?.company.name ?? '-'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CEP</label>
              <Input value={companyAddress.zipCode} onChange={(event) => updateCompanyAddressField('zipCode', event.target.value)} onBlur={handleCepBlur} disabled={isLookingUpCep} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Rua</label>
              <Input value={companyAddress.street} onChange={(event) => updateCompanyAddressField('street', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Numero</label>
              <Input value={companyAddress.number} onChange={(event) => updateCompanyAddressField('number', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Complemento</label>
              <Input value={companyAddress.complement} onChange={(event) => updateCompanyAddressField('complement', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Estado</label>
              <Select value={companyAddress.state} onValueChange={handleStateChange}>
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
              <label className="text-sm font-medium text-foreground">Cidade</label>
              <Input list="company-city-options" value={companyAddress.city} onChange={(event) => handleCityChange(event.target.value)} disabled={!companyAddress.state} />
              <datalist id="company-city-options">
                {cityOptions.map((city) => (
                  <option key={`${city.id}-${city.name}`} value={city.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Bairro</label>
              <Input list="company-neighborhood-options" value={companyAddress.district} onChange={(event) => updateCompanyAddressField('district', event.target.value)} />
              <datalist id="company-neighborhood-options">
                {neighborhoodOptions.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pais</label>
              <Input value={companyAddress.country} onChange={(event) => updateCompanyAddressField('country', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Latitude</label>
              <Input type="number" step="0.0000001" value={companyAddress.latitude} onChange={(event) => updateCompanyAddressField('latitude', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Longitude</label>
              <Input type="number" step="0.0000001" value={companyAddress.longitude} onChange={(event) => updateCompanyAddressField('longitude', event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Endereco formatado</label>
            <Input value={companyAddress.formattedAddress} readOnly />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveCompanyAddress} disabled={isSavingCompanyAddress}>
              {isSavingCompanyAddress ? 'Salvando...' : 'Salvar endereco da empresa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Calculo Atual
          </CardTitle>
          <CardDescription>Referencia de tarifa atual do usuario autenticado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>R$/km atual:</strong> R$ {currentRate.toFixed(2)}</p>
          <p><strong>Perfil:</strong> {profile?.role ?? '-'}</p>
          <p><strong>Departamento:</strong> {profile?.department ?? '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Estado da Integracao
          </CardTitle>
          <CardDescription>Resumo do que ja esta usando dados reais.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="default">Login real</Badge>
          <Badge variant="default">Perfil real</Badge>
          <Badge variant="default">Presencas reais</Badge>
          <Badge variant="default">Aprovacao real</Badge>
          <Badge variant="default">Tarifa em lote real</Badge>
          <Badge variant="default">Funcionarios reais</Badge>
          <Badge variant="default">Relatorios reais</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissoes
          </CardTitle>
          <CardDescription>Perfis suportados atualmente pelo backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Funcionario:</strong> consulta o proprio perfil, resumo e presencas.</p>
          <p><strong>Supervisor:</strong> consulta equipe, aprova pendencias, edita usuarios, altera senhas e define tarifas.</p>
          <p><strong>Admin:</strong> possui os mesmos poderes de gestao e tambem pode registrar as proprias presencas.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;





