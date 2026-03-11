import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Plus, MapPin, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api, type PresenceResponse, type ProfileResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import RegisterAttendanceModal from '../../components/RegisterAttendanceModal';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { toast } from 'sonner';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [monthlyAttendances, setMonthlyAttendances] = useState<PresenceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPresenceDays: 0,
    totalDistanceKm: 0,
    totalReimbursement: 0
  });

  const currentMonth = displayDate.getMonth() + 1;
  const currentYear = displayDate.getFullYear();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getMyDashboard(currentMonth, currentYear);
      setProfile(response.profile);
      setMonthlyAttendances(response.presences);
      setSummary(response.summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o dashboard.');
    }
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  const attendanceDates = monthlyAttendances.map((attendance) => attendance.presenceDate);
  const lastAttendance = [...monthlyAttendances].sort(
    (a, b) => new Date(b.presenceDate).getTime() - new Date(a.presenceDate).getTime()
  )[0];
  const currentRate = profile?.monthlyRates.find((rate) => rate.year === currentYear && rate.month === currentMonth);
  const totalDailyDistanceKm = profile?.totalDailyDistanceKm ?? monthlyAttendances[0]?.distanceRoundTripKm ?? 0;

  const handleToggleDate = (date: string) => {
    setSelectedDates((currentDates) =>
      currentDates.includes(date)
        ? currentDates.filter((item) => item !== date)
        : [...currentDates, date].sort()
    );
  };

  const handleRegisterSelectedDates = async ({
    dates,
    observation
  }: {
    dates: string[];
    observation: string;
  }) => {
    await api.createMyPresences({
      dates,
      observation
    });

    setSelectedDates([]);
    await loadData();
  };

  const changeMonth = (direction: -1 | 1) => {
    setDisplayDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDates([]);
  };

  const monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(displayDate);

  const getStatusBadge = (status: PresenceResponse['status']) => (
    <StatusBadge status={status} />
  );

  if (isLoading && !profile) {
    return <LoadingState message="Carregando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {user?.name}! Aqui está o resumo das suas presenças.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2" disabled={selectedDates.length === 0}>
          <Plus className="w-4 h-4" />
          Criar registros selecionados
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              Dias Presenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{summary.totalPresenceDays}</div>
            <p className="text-xs text-muted-foreground mt-1">em {monthLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Quilômetros Totais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{summary.totalDistanceKm.toFixed(2)} km</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDailyDistanceKm.toFixed(2)} km por dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Valor Estimado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-accent">
              R$ {summary.totalReimbursement.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {currentRate?.reimbursementPerKm.toFixed(2) ?? '0.00'}/km
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Último Registro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">
              {lastAttendance ? new Date(`${lastAttendance.presenceDate}T00:00:00`).toLocaleDateString('pt-BR') : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastAttendance ? getStatusBadge(lastAttendance.status) : 'Nenhum registro'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendário de Presenças</CardTitle>
            <CardDescription>
              Selecione os dias úteis presenciais e gere todos os lançamentos de uma vez.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedDates.length === 0
                      ? 'Nenhum dia selecionado'
                      : `${selectedDates.length} dia(s) pronto(s) para registrar`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Finais de semana, datas futuras e dias já lançados ficam bloqueados.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDates([])}
                    disabled={selectedDates.length === 0}
                  >
                    Limpar seleção
                  </Button>
                  <Button onClick={() => setIsModalOpen(true)} disabled={selectedDates.length === 0}>
                    Registrar selecionados
                  </Button>
                </div>
              </div>
            </div>

            <AttendanceCalendar
              attendanceDates={attendanceDates}
              month={currentMonth}
              year={currentYear}
              selectedDates={selectedDates}
              onToggleDate={handleToggleDate}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lançamentos Recentes</CardTitle>
            <CardDescription>Últimos registros de presença</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyAttendances.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum registro neste mês</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...monthlyAttendances]
                  .sort((a, b) => new Date(b.presenceDate).getTime() - new Date(a.presenceDate).getTime())
                  .slice(0, 5)
                  .map((attendance) => (
                    <div
                      key={attendance.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {new Date(`${attendance.presenceDate}T00:00:00`).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                          <StatusBadge status={attendance.status} />
                        </div>
                        {attendance.observation && (
                          <p className="text-xs text-muted-foreground truncate">{attendance.observation}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          R$ {attendance.reimbursementAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {attendance.distanceRoundTripKm.toFixed(2)} km
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-base">Endereço da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              {profile?.companyAddress?.street}, {profile?.companyAddress?.number}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile?.companyAddress?.district} - {profile?.companyAddress?.city}/{profile?.companyAddress?.state}
            </p>
            <p className="text-sm text-muted-foreground">
              CEP {profile?.companyAddress?.zipCode}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="text-base">Seu Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              {profile?.homeAddress?.street}, {profile?.homeAddress?.number}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile?.homeAddress?.district} - {profile?.homeAddress?.city}/{profile?.homeAddress?.state}
            </p>
            <p className="text-sm text-muted-foreground">
              CEP {profile?.homeAddress?.zipCode}
            </p>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distância diária (ida e volta):</span>
                <span className="font-semibold text-foreground">
                  {totalDailyDistanceKm.toFixed(2)} km
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RegisterAttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDates={selectedDates}
        onSubmit={handleRegisterSelectedDates}
        employee={
          profile
            ? {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                employeeId: profile.employeeCode ?? '',
                team: profile.department ?? '',
                supervisor: profile.supervisorName ?? '',
                status: 'active',
                address: {
                  cep: profile.homeAddress?.zipCode ?? '',
                  street: profile.homeAddress?.street ?? '',
                  number: profile.homeAddress?.number ?? '',
                  neighborhood: profile.homeAddress?.district ?? '',
                  city: profile.homeAddress?.city ?? '',
                  state: profile.homeAddress?.state ?? ''
                },
                distanceToCompanyKm: profile.distanceToCompanyKm ?? 0,
                distanceFromCompanyKm: profile.distanceFromCompanyKm ?? 0,
                kmPerDay: totalDailyDistanceKm,
                valuePerKm: currentRate?.reimbursementPerKm ?? 0
              }
            : undefined
        }
        companyAddress={{
          street: profile?.companyAddress?.street ?? '',
          number: profile?.companyAddress?.number ?? '',
          neighborhood: profile?.companyAddress?.district ?? '',
          city: profile?.companyAddress?.city ?? '',
          state: profile?.companyAddress?.state ?? '',
          cep: profile?.companyAddress?.zipCode ?? ''
        }}
      />
    </div>
  );
};

export default EmployeeDashboard;
