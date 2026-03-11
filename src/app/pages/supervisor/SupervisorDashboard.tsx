import React, { useEffect, useState } from 'react';
import { Users, Calendar, MapPin, DollarSign, AlertCircle, Filter } from 'lucide-react';
import { api, type EmployeeResponse, type MonthlyReportResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LoadingState } from '../../components/LoadingState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

const SupervisorDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [report, setReport] = useState<MonthlyReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.getSupervisorOverview(Number(selectedMonth), Number(selectedYear));
        setEmployees(response.employees);
        setReport(response.report);
        setIsLoading(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard gerencial.');
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedMonth, selectedYear]);

  const activeEmployees = employees.filter((employee) => employee.active);
  const inactiveEmployees = employees.length - activeEmployees.length;
  const totalDays = report.reduce((sum, item) => sum + item.totalPresenceDays, 0);
  const totalKm = report.reduce((sum, item) => sum + item.totalDistanceKm, 0);
  const totalValue = report.reduce((sum, item) => sum + item.totalReimbursement, 0);
  const pendingApprovals = report.reduce(
    (sum, item) => sum + item.records.filter((record) => record.status === 'pending').length,
    0
  );

  const employeeData = report.map((item) => ({
    name: item.employeeName.split(' ')[0],
    days: item.totalPresenceDays,
    value: item.totalReimbursement
  }));

  const statusData = [
    {
      name: 'Aprovados',
      value: report.reduce(
        (sum, item) => sum + item.records.filter((record) => record.status === 'approved').length,
        0
      ),
      color: '#2563EB'
    },
    {
      name: 'Pendentes',
      value: pendingApprovals,
      color: '#F59E0B'
    },
    {
      name: 'Rejeitados',
      value: report.reduce(
        (sum, item) => sum + item.records.filter((record) => record.status === 'rejected').length,
        0
      ),
      color: '#EF4444'
    }
  ].filter((item) => item.value > 0);

  const topEmployees = [...report]
    .sort((a, b) => b.totalReimbursement - a.totalReimbursement)
    .slice(0, 5);

  if (isLoading && employees.length === 0 && report.length === 0) {
    return <LoadingState message="Carregando dashboard gerencial..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Gerencial</h1>
          <p className="text-muted-foreground">Visao geral dos reembolsos e presencas da equipe</p>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Filter className="w-5 h-5 text-muted-foreground hidden sm:block" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Marco</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Funcionarios Ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{inactiveEmployees} inativos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total de Dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{totalDays}</div>
            <p className="text-xs text-muted-foreground mt-1">Dias presenciais no mes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Total de KM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{totalKm.toFixed(2)} km</div>
            <p className="text-xs text-muted-foreground mt-1">Quilometragem total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Previsto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-accent">R$ {totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor de reembolso</p>
          </CardContent>
        </Card>
      </div>

      {pendingApprovals > 0 && (
        <Card className="border-l-4 border-l-chart-4 bg-chart-4/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-chart-4" />
              Aprovacoes Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              Existem <strong>{pendingApprovals} registros</strong> aguardando sua aprovacao.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dias Presenciais por Funcionario</CardTitle>
            <CardDescription>Comparativo de presenca da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="days" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Registros</CardTitle>
            <CardDescription>Distribuicao por status de aprovacao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Funcionarios</CardTitle>
          <CardDescription>Maiores valores de reembolso no periodo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado para o periodo selecionado.</p>
            ) : (
              topEmployees.map((employee, index) => (
                <div key={employee.employeeId} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{employee.employeeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.department} • {employee.totalPresenceDays} dias presenciais
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-accent">R$ {employee.totalReimbursement.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{employee.totalDistanceKm.toFixed(2)} km</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;
