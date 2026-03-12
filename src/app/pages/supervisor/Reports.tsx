import React, { useEffect, useMemo, useState } from 'react';
import { Check, FileSpreadsheet, Filter, TrendingUp, Users, Calendar, DollarSign, X } from 'lucide-react';
import { api, type CompanyPeriodResponse, type EmployeeResponse, type MonthlyReportResponse } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { formatPeriodLabel } from '../../lib/period';
import { toast } from 'sonner';

const DEFAULT_UNIT = '1';
const CRISDU_XLSX_THEME = {
  background: 'FFF4FBFF',
  text: 'FF1F365C',
  primary: 'FF2CC7E8',
  accent: 'FF4D7EF6',
  muted: 'FFEAF6FF',
  border: 'FFCFE8F8',
  white: 'FFFFFFFF'
};

const Reports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [report, setReport] = useState<MonthlyReportResponse[]>([]);
  const [period, setPeriod] = useState<CompanyPeriodResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSupervisorOverview(Number(selectedMonth), Number(selectedYear));
      setEmployees(response.employees);
      setReport(response.report);
      setPeriod(response.period);
      setIsLoading(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os relatórios.');
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

  const operationalRows = useMemo(() => {
    const reportMap = new Map(filteredReport.map((item) => [item.employeeId, item]));
    const sourceEmployees = (
      selectedEmployee === 'all' ? employees : employees.filter((employee) => employee.id === selectedEmployee)
    ).filter((employee) => employee.role !== 'admin');

    return sourceEmployees.map((employee) => {
      const employeeReport = reportMap.get(employee.id);
      const pending = employeeReport?.records.filter((record) => record.status === 'pending').length ?? 0;
      const quantityDays = employeeReport?.totalPresenceDays ?? 0;
      const totalKm = employeeReport?.totalDistanceKm ?? 0;
      const totalDailyKm =
        employee.totalDailyDistanceKm ??
        (quantityDays > 0 ? Number((totalKm / quantityDays).toFixed(2)) : 0);

      return {
        unit: employee.department || DEFAULT_UNIT,
        code: employee.employeeCode || '-',
        collaborator: employee.name,
        totalDailyKm,
        quantityDays,
        totalReimbursement: employeeReport?.totalReimbursement ?? 0,
        observation: pending > 0 ? `${pending} pendente(s)` : ''
      };
    });
  }, [employees, filteredReport, selectedEmployee]);

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
  const uniqueEmployees = operationalRows.length;
  const pendingRecordIds = detailedRows.filter((row) => row.status === 'pending').map((row) => row.id);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const formatDecimal = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ['Unidade', 'Código', 'Colaborador', 'TOTAL KM / DIA', 'QNTD DIAS NO MÊS', 'TOTAL R$', 'Observação'];
    const rows = operationalRows.map((row) => [
      row.unit,
      row.code,
      row.collaborator,
      formatDecimal(row.totalDailyKm),
      String(row.quantityDays),
      formatCurrency(row.totalReimbursement),
      row.observation
    ]);

    const csvContent = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: 'text/csv;charset=utf-8;'
    });
    downloadBlob(blob, `relatorio-operacional-${selectedYear}-${selectedMonth}.csv`);

    toast.success('Planilha exportada com sucesso.');
  };

  const exportFormattedExcel = async () => {
    try {
      const excelJsModule = await import('exceljs');
      const Workbook =
        excelJsModule.Workbook ??
        excelJsModule.default?.Workbook;

      if (!Workbook) {
        throw new Error('ExcelJS Workbook export not found.');
      }

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Relatório Operacional', {
        views: [{ state: 'frozen', ySplit: 3 }]
      });

      workbook.creator = 'Crisdu Labs';
      workbook.company = 'Crisdu Labs';
      workbook.subject = 'Relatório operacional de reembolso';
      workbook.title = 'Relatório Operacional - Crisdu Labs';

      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'Crisdu Labs | Relatório Operacional';
      worksheet.getCell('A1').font = {
        name: 'Calibri',
        size: 16,
        bold: true,
        color: { argb: CRISDU_XLSX_THEME.white }
      };
      worksheet.getCell('A1').alignment = {
        horizontal: 'left',
        vertical: 'middle'
      };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: CRISDU_XLSX_THEME.accent }
      };
      worksheet.getRow(1).height = 26;

      worksheet.mergeCells('A2:G2');
      worksheet.getCell('A2').value = period
        ? `Período: ${formatPeriodLabel(period)}`
        : `Referência: ${selectedMonth}/${selectedYear}`;
      worksheet.getCell('A2').font = {
        name: 'Calibri',
        size: 11,
        italic: true,
        color: { argb: CRISDU_XLSX_THEME.text }
      };
      worksheet.getCell('A2').alignment = {
        horizontal: 'left',
        vertical: 'middle'
      };
      worksheet.getCell('A2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: CRISDU_XLSX_THEME.background }
      };
      worksheet.getRow(2).height = 20;

      worksheet.columns = [
        { key: 'unit', width: 14 },
        { key: 'code', width: 14 },
        { key: 'collaborator', width: 30 },
        { key: 'totalDailyKm', width: 18 },
        { key: 'quantityDays', width: 18 },
        { key: 'totalReimbursement', width: 18 },
        { key: 'observation', width: 28 }
      ];

      worksheet.getRow(3).values = [
        'Unidade',
        'Código',
        'Colaborador',
        'TOTAL KM / DIA',
        'QNTD DIAS NO MÊS',
        'TOTAL R$',
        'Observação'
      ];

      operationalRows.forEach((row) => {
        worksheet.addRow({
          unit: row.unit,
          code: row.code,
          collaborator: row.collaborator,
          totalDailyKm: row.totalDailyKm,
          quantityDays: row.quantityDays,
          totalReimbursement: row.totalReimbursement,
          observation: row.observation
        });
      });

      const headerRow = worksheet.getRow(3);
      headerRow.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: CRISDU_XLSX_THEME.white }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: CRISDU_XLSX_THEME.primary }
      };
      headerRow.height = 24;

      worksheet.autoFilter = {
        from: 'A3',
        to: 'G3'
      };

      worksheet.eachRow((row, rowNumber) => {
        row.height = 22;
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: CRISDU_XLSX_THEME.border } },
            left: { style: 'thin', color: { argb: CRISDU_XLSX_THEME.border } },
            bottom: { style: 'thin', color: { argb: CRISDU_XLSX_THEME.border } },
            right: { style: 'thin', color: { argb: CRISDU_XLSX_THEME.border } }
          };

          if (rowNumber > 3) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: rowNumber % 2 === 0
                  ? CRISDU_XLSX_THEME.background
                  : CRISDU_XLSX_THEME.muted
              }
            };
            cell.font = {
              name: 'Calibri',
              size: 11,
              color: { argb: CRISDU_XLSX_THEME.text }
            };
          }
        });
      });

      worksheet.getColumn('D').numFmt = '#,##0.00';
      worksheet.getColumn('E').numFmt = '0';
      worksheet.getColumn('F').numFmt = '"R$" #,##0.00';

      ['D', 'E', 'F'].forEach((columnKey) => {
        worksheet.getColumn(columnKey).alignment = { horizontal: 'right', vertical: 'middle' };
      });

      ['A', 'B', 'C', 'G'].forEach((columnKey) => {
        worksheet.getColumn(columnKey).alignment = { horizontal: 'left', vertical: 'middle' };
      });

      worksheet.getColumn('F').eachCell((cell, rowNumber) => {
        if (rowNumber > 3) {
          cell.font = {
            name: 'Calibri',
            size: 11,
            bold: true,
            color: { argb: CRISDU_XLSX_THEME.accent }
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
        `relatorio-operacional-${selectedYear}-${selectedMonth}.xlsx`
      );

      toast.success('Excel formatado exportado com sucesso.');
    } catch (error) {
      toast.error('Não foi possível gerar o arquivo Excel formatado.');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setIsUpdating(true);

    try {
      await api.updatePresenceStatus(id, status);
      toast.success(status === 'approved' ? 'Registro aprovado.' : 'Registro rejeitado.');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o registro.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveAllPending = async () => {
    if (pendingRecordIds.length === 0) {
      toast.info('Não há registros pendentes no filtro atual.');
      return;
    }

    setIsUpdating(true);

    try {
      const result = await api.updateManyPresenceStatuses(pendingRecordIds, 'approved');
      toast.success(`${result.updated} registro(s) pendente(s) aprovado(s).`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível aprovar os registros pendentes.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && employees.length === 0 && report.length === 0) {
    return <LoadingState message="Carregando relatórios..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada de reembolsos e presenças</p>
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
            Filtros Avançados
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
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
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
              <Button variant="outline" onClick={exportCsv} className="flex-1 gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" onClick={exportFormattedExcel} className="flex-1 gap-2">
                <FileSpreadsheet className="w-4 h-4" />
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
              Funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">{uniqueEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Com presença registrada</p>
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

      <Tabs defaultValue="operational" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="operational">Visão Operacional</TabsTrigger>
          <TabsTrigger value="detailed">Relatório Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="operational">
          <Card>
            <CardHeader>
              <CardTitle>Visão Padrão para Supervisor</CardTitle>
              <CardDescription>Resumo mensal no formato operacional solicitado pela supervisão</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-right">TOTAL KM / DIA</TableHead>
                    <TableHead className="text-right">QNTD DIAS NO MÊS</TableHead>
                    <TableHead className="text-right">TOTAL R$</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationalRows.map((row) => (
                    <TableRow key={`${row.code}-${row.collaborator}`}>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell className="font-mono text-sm">{row.code}</TableCell>
                      <TableCell className="font-medium">{row.collaborator}</TableCell>
                      <TableCell className="text-right">{formatDecimal(row.totalDailyKm)}</TableCell>
                      <TableCell className="text-right">{row.quantityDays}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(row.totalReimbursement)}</TableCell>
                      <TableCell>{row.observation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado por Registro</CardTitle>
              <CardDescription>Lista completa de todos os lançamentos do período</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">KM</TableHead>
                    <TableHead className="text-right">R$/km</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
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
                          <span className="text-xs text-muted-foreground">Sem ações</span>
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

