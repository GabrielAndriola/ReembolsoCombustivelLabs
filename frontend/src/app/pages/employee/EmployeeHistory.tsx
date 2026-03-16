import React, { useEffect, useState } from 'react';
import { Calendar, Download, FileText, Filter, MapPin, DollarSign } from 'lucide-react';
import { api, type CompanyPeriodResponse, type PresenceResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { formatPeriodLabel } from '../../lib/period';
import { toast } from 'sonner';

const EmployeeHistory: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [attendances, setAttendances] = useState<PresenceResponse[]>([]);
  const [period, setPeriod] = useState<CompanyPeriodResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPresenceDays: 0,
    totalDistanceKm: 0,
    totalReimbursement: 0
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const month = Number(selectedMonth);
        const year = Number(selectedYear);
        const [presencesResponse, summaryResponse] = await Promise.all([
          api.getMyPresences(month, year),
          api.getMySummary(month, year)
        ]);

        setAttendances(presencesResponse.presences);
        setPeriod(presencesResponse.period);
        setSummary(summaryResponse);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o histórico.');
      }
    };

    loadData();
  }, [selectedMonth, selectedYear]);

  const approvedCount = attendances.filter((attendance) => attendance.status === 'approved').length;
  const pendingCount = attendances.filter((attendance) => attendance.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <StatusBadge status="approved" />;
      case 'pending':
        return <StatusBadge status="pending" />;
      case 'rejected':
        return <StatusBadge status="rejected" />;
      default:
        return <span className="text-sm text-foreground">{status}</span>;
    }
  };

  const handleExportPDF = () => {
    toast.info('Exportação para PDF ficará para a próxima etapa do MVP.');
  };

  const handleExportExcel = () => {
    toast.info('Exportação para Excel ficará para a próxima etapa do MVP.');
  };

  if (isLoading && attendances.length === 0 && summary.totalPresenceDays === 0) {
    return <LoadingState message="Carregando histórico..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Histórico de Presenças</h1>
          <p className="text-muted-foreground">
            Visualize todos os seus registros de presença.
          </p>
          {period && (
            <p className="text-sm text-muted-foreground mt-1">
              Período considerado: {formatPeriodLabel(period)}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-muted-foreground">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
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
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm text-muted-foreground">Ano</label>
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

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                <Download className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total de Dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{summary.totalPresenceDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedCount} aprovados, {pendingCount} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Total de KM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{summary.totalDistanceKm.toFixed(2)} km</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de {summary.totalPresenceDays > 0 ? (summary.totalDistanceKm / summary.totalPresenceDays).toFixed(2) : '0.00'} km/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-accent">
              R$ {summary.totalReimbursement.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reembolso do período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Taxa de Aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {summary.totalPresenceDays > 0 ? Math.round((approvedCount / summary.totalPresenceDays) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedCount} de {summary.totalPresenceDays} registros
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Registros</CardTitle>
          <CardDescription>
            Lista completa de presenças do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-muted-foreground">
                Não há registros de presença para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">KM do Dia</TableHead>
                    <TableHead className="text-right">Valor do Dia</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">
                        {new Date(`${attendance.presenceDate}T00:00:00`).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                      <TableCell className="text-right">{attendance.distanceRoundTripKm.toFixed(2)} km</TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {attendance.reimbursementAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {attendance.observation || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeHistory;
