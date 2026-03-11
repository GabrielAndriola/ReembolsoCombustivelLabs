import React, { useEffect, useMemo, useState } from 'react';
import { Check, FileText, Filter, TrendingUp, Users, Calendar, DollarSign, X } from 'lucide-react';
import { api, type EmployeeResponse, type MonthlyReportResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { toast } from 'sonner';

const Reports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [report, setReport] = useState<MonthlyReportResponse[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSupervisorOverview(Number(selectedMonth), Number(selectedYear));
      setEmployees(response.employees);
      setReport(response.report);
      setIsLoading(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar os relatorios.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const filteredReport = useMemo(
    () => report.filter((item) => selectedEmployee === 'all' || item.employeeId === selectedEmployee),
    [report, selectedEmployee]
  );

  const detailedRows = filteredReport.flatMap((item) =>
    item.records.map((record) => ({
      id: record.id,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      department: item.department,
      date: record.date,
      status: record.status,
      reimbursementPerKmApplied: record.reimbursementPerKmApplied,
      reimbursementAmount: record.reimbursementAmount,
      averageKm: item.totalPresenceDays > 0 ? item.totalDistanceKm / item.totalPresenceDays : 0
    }))
  );

  const totalDays = filteredReport.reduce((sum, item) => sum + item.totalPresenceDays, 0);
  const totalKm = filteredReport.reduce((sum, item) => sum + item.totalDistanceKm, 0);
  const totalValue = filteredReport.reduce((sum, item) => sum + item.totalReimbursement, 0);
  const uniqueEmployees = filteredReport.length;
  const pendingRecordIds = detailedRows.filter((row) => row.status === 'pending').map((row) => row.id);

  const handleExport = (format: 'pdf' | 'excel') => {
    toast.info(`Exportacao ${format.toUpperCase()} ainda nao foi implementada.`);
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setIsUpdating(true);

    try {
      await api.updatePresenceStatus(id, status);
      toast.success(status === 'approved' ? 'Registro aprovado.' : 'Registro rejeitado.');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o registro.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveAllPending = async () => {
    if (pendingRecordIds.length === 0) {
      toast.info('Nao ha registros pendentes no filtro atual.');
      return;
    }

    setIsUpdating(true);

    try {
      const result = await api.updateManyPresenceStatuses(pendingRecordIds, 'approved');
      toast.success(`${result.updated} registro(s) pendente(s) aprovado(s).`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel aprovar os registros pendentes.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && employees.length === 0 && report.length === 0) {
    return <LoadingState message="Carregando relatorios..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Relatorios</h1>
          <p className="text-muted-foreground">Analise detalhada de reembolsos e presencas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avancados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os funcionarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionarios</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleApproveAllPending} disabled={isUpdating || pendingRecordIds.length === 0} className="flex-1 gap-2">
                <Check className="w-4 h-4" />
                Aprovar Pendentes
              </Button>
              <Button variant="outline" onClick={() => handleExport('pdf')} className="flex-1 gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')} className="flex-1 gap-2">
                <FileText className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Funcionarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{uniqueEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Com presenca registrada</p>
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
            <p className="text-xs text-muted-foreground mt-1">Dias presenciais registrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total de KM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{totalKm.toFixed(2)} km</div>
            <p className="text-xs text-muted-foreground mt-1">Quilometragem acumulada</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-accent">R$ {totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total a ser reembolsado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="consolidated" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consolidated">Relatorio Consolidado</TabsTrigger>
          <TabsTrigger value="detailed">Relatorio Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="consolidated">
          <Card>
            <CardHeader>
              <CardTitle>Relatorio Consolidado por Funcionario</CardTitle>
              <CardDescription>Resumo de reembolsos agrupado por colaborador</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead className="text-right">KM Total</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReport.map((item) => {
                    const approved = item.records.filter((record) => record.status === 'approved').length;
                    const pending = item.records.filter((record) => record.status === 'pending').length;

                    return (
                      <TableRow key={item.employeeId}>
                        <TableCell className="font-medium">{item.employeeName}</TableCell>
                        <TableCell>{item.department}</TableCell>
                        <TableCell className="text-right">{item.totalPresenceDays}</TableCell>
                        <TableCell className="text-right">{item.totalDistanceKm.toFixed(2)} km</TableCell>
                        <TableCell className="text-right font-semibold">R$ {item.totalReimbursement.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            {approved > 0 && <Badge variant="default" className="text-xs">{approved} aprovados</Badge>}
                            {pending > 0 && <Badge variant="secondary" className="text-xs">{pending} pendentes</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Relatorio Detalhado por Registro</CardTitle>
              <CardDescription>Lista completa de todos os lancamentos do periodo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">KM</TableHead>
                    <TableHead className="text-right">R$/km</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{new Date(`${row.date}T00:00:00`).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell className="text-right">{row.averageKm.toFixed(2)} km</TableCell>
                      <TableCell className="text-right">R$ {row.reimbursementPerKmApplied.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">R$ {row.reimbursementAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleUpdateStatus(row.id, 'approved')} disabled={isUpdating} className="gap-2">
                              <Check className="w-4 h-4" />
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(row.id, 'rejected')} disabled={isUpdating} className="gap-2">
                              <X className="w-4 h-4" />
                              Rejeitar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem acoes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
