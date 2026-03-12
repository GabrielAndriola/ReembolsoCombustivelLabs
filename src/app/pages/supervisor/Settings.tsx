import React, { useEffect, useMemo, useState } from 'react';
import { Building2, DollarSign, Settings as SettingsIcon, Shield, CheckSquare } from 'lucide-react';
import { api, type ProfileResponse, type RateTargetResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { LoadingState } from '../../components/LoadingState';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [targets, setTargets] = useState<RateTargetResponse[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [valuePerKm, setValuePerKm] = useState('0.65');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCompanyAddress, setIsSavingCompanyAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileResponse, targetsResponse] = await Promise.all([
        api.getMyProfile(),
        api.getRateTargets()
      ]);
      const selectedRate =
        profileResponse.monthlyRates.find(
          (rate) => rate.year === Number(year) && rate.month === Number(month)
        )?.reimbursementPerKm ??
        profileResponse.monthlyRates[0]?.reimbursementPerKm ??
        0;

      setProfile(profileResponse);
      setTargets(targetsResponse);
      setValuePerKm(selectedRate > 0 ? selectedRate.toFixed(2) : '');
      setCompanyAddress({
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
      });
      setIsLoading(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as configurações.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentRate =
    profile?.monthlyRates.find(
      (rate) => rate.year === Number(year) && rate.month === Number(month)
    )?.reimbursementPerKm ??
    profile?.monthlyRates[0]?.reimbursementPerKm ??
    0;

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
      toast.error('Informe um valor por km válido.');
      return;
    }

    if (!applyToAll && selectedIds.length === 0) {
      toast.error('Selecione pelo menos um usuário para aplicar a nova tarifa.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await api.applyRate({
        year: Number(year),
        month: Number(month),
        reimbursementPerKm,
        applyToAll,
        userIds: applyToAll ? undefined : selectedIds
      });
      setValuePerKm(reimbursementPerKm.toFixed(2));
      toast.success(`Tarifa aplicada para ${result.updated} usuário(s).`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível aplicar a nova tarifa.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCompanyAddressField = (field: keyof typeof companyAddress, value: string) => {
    setCompanyAddress((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSaveCompanyAddress = async () => {
    if (
      !companyAddress.zipCode ||
      !companyAddress.street ||
      !companyAddress.number ||
      !companyAddress.district ||
      !companyAddress.city ||
      !companyAddress.state ||
      !companyAddress.formattedAddress
    ) {
      toast.error('Preencha os campos obrigatórios do endereço da empresa.');
      return;
    }

    setIsSavingCompanyAddress(true);

    try {
      await api.updateCompanyAddress({
        zipCode: companyAddress.zipCode,
        street: companyAddress.street,
        number: companyAddress.number,
        complement: companyAddress.complement || undefined,
        district: companyAddress.district,
        city: companyAddress.city,
        state: companyAddress.state,
        country: companyAddress.country || 'Brasil',
        latitude: companyAddress.latitude ? Number(companyAddress.latitude) : null,
        longitude: companyAddress.longitude ? Number(companyAddress.longitude) : null,
        formattedAddress: companyAddress.formattedAddress
      });
      toast.success('Endereço da empresa atualizado.');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o endereço da empresa.');
    } finally {
      setIsSavingCompanyAddress(false);
    }
  };

  if (isLoading && !profile) {
    return <LoadingState message="Carregando configurações..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie tarifa de reembolso e informações atuais do ambiente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Definir R$/km
          </CardTitle>
          <CardDescription>Supervisor e admin podem aplicar uma nova tarifa para usuários selecionados ou para todos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">R$/km</label>
              <Input type="number" min="0.01" step="0.01" value={valuePerKm} onChange={(event) => setValuePerKm(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mês</label>
              <Input type="number" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ano</label>
              <Input type="number" min="2024" value={year} onChange={(event) => setYear(event.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox id="applyToAll" checked={applyToAll} onCheckedChange={(checked) => setApplyToAll(Boolean(checked))} />
            <label htmlFor="applyToAll" className="text-sm text-foreground">
              Aplicar para todos os usuários da empresa
            </label>
          </div>

          {!applyToAll && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckSquare className="w-4 h-4" />
                {selectedIds.length} usuário(s) selecionado(s)
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
              {isSaving ? 'Aplicando...' : `Aplicar para ${selectedCount} usuário(s)`}
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
          <CardDescription>Supervisor e admin podem ajustar o endereço principal da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {profile?.company.name ?? '-'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CEP</label>
              <Input value={companyAddress.zipCode} onChange={(event) => updateCompanyAddressField('zipCode', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Rua</label>
              <Input value={companyAddress.street} onChange={(event) => updateCompanyAddressField('street', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Número</label>
              <Input value={companyAddress.number} onChange={(event) => updateCompanyAddressField('number', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Complemento</label>
              <Input value={companyAddress.complement} onChange={(event) => updateCompanyAddressField('complement', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bairro</label>
              <Input value={companyAddress.district} onChange={(event) => updateCompanyAddressField('district', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cidade</label>
              <Input value={companyAddress.city} onChange={(event) => updateCompanyAddressField('city', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Estado</label>
              <Input value={companyAddress.state} onChange={(event) => updateCompanyAddressField('state', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">País</label>
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
            <label className="text-sm font-medium text-foreground">Endereço formatado</label>
            <Input value={companyAddress.formattedAddress} onChange={(event) => updateCompanyAddressField('formattedAddress', event.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveCompanyAddress} disabled={isSavingCompanyAddress}>
              {isSavingCompanyAddress ? 'Salvando...' : 'Salvar endereço da empresa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cálculo Atual
          </CardTitle>
          <CardDescription>Referência de tarifa atual do usuário autenticado.</CardDescription>
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
            Estado da Integração
          </CardTitle>
          <CardDescription>Resumo do que já está usando dados reais.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="default">Login real</Badge>
          <Badge variant="default">Perfil real</Badge>
          <Badge variant="default">Presenças reais</Badge>
          <Badge variant="default">Aprovação real</Badge>
          <Badge variant="default">Tarifa em lote real</Badge>
          <Badge variant="default">Funcionários reais</Badge>
          <Badge variant="default">Relatórios reais</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissões
          </CardTitle>
          <CardDescription>Perfis suportados atualmente pelo backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Funcionário:</strong> consulta o próprio perfil, resumo e presenças.</p>
          <p><strong>Supervisor:</strong> consulta equipe, aprova pendências, edita usuários, altera senhas e define tarifas.</p>
          <p><strong>Admin:</strong> possui os mesmos poderes de gestão e também pode registrar as próprias presenças.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
