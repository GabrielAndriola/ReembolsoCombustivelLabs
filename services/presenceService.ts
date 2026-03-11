import { monthlyRateRepository } from '../repositories/monthlyRateRepository';
import { presenceRepository } from '../repositories/presenceRepository';
import { AppError } from '../utils/app-error';
import { cache } from '../utils/cache';
import { getMonthBounds, toDateOnly } from '../utils/date';
import { serializeStatus, toNumber } from '../utils/serializers';
import { userRepository } from '../repositories/userRepository';

const READ_TTL_MS = 30_000;

export const presenceService = {
  async list(employeeUserId: string, month: number, year: number) {
    const cacheKey = `presence:list:${employeeUserId}:${year}:${month}`;
    const cached = cache.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { start, end } = getMonthBounds(month, year);
    const presences = await presenceRepository.findMany(employeeUserId, start, end);

    return cache.set(cacheKey, presences.map((presence) => ({
      id: presence.id,
      presenceDate: presence.presenceDate.toISOString().slice(0, 10),
      observation: presence.observation,
      status: serializeStatus(presence.status),
      distanceOneWayKm: toNumber(presence.distanceOneWayKm),
      distanceRoundTripKm: toNumber(presence.distanceRoundTripKm),
      reimbursementPerKmApplied: toNumber(presence.reimbursementPerKmApplied),
      reimbursementAmount: toNumber(presence.reimbursementAmount),
      calculatedAt: presence.calculatedAt.toISOString()
    })), READ_TTL_MS);
  },

  async create(employeeUserId: string, _companyId: string, dates: string[], observation?: string) {
    const employee = await userRepository.findById(employeeUserId);

    if (!employee?.employeeProfile) {
      throw new AppError('Perfil do colaborador nao encontrado.', 404);
    }

    const distanceOneWayKm = employee.employeeProfile.distanceToCompanyKm == null
      ? null
      : toNumber(employee.employeeProfile.distanceToCompanyKm);
    const distanceReturnKm = employee.employeeProfile.distanceFromCompanyKm == null
      ? null
      : toNumber(employee.employeeProfile.distanceFromCompanyKm);

    if (distanceOneWayKm == null || distanceReturnKm == null) {
      throw new AppError('Nao existe distancia de ida e volta configurada para este colaborador.', 400);
    }

    const uniqueDates = [...new Set(dates)].sort();

    for (const date of uniqueDates) {
      const existing = await presenceRepository.findByDate(employeeUserId, toDateOnly(date));

      if (existing) {
        throw new AppError(`Ja existe lancamento para ${date}.`, 409);
      }
    }

    const distanceRoundTripKm = Number((distanceOneWayKm + distanceReturnKm).toFixed(2));

    const records = [];

    for (const date of uniqueDates) {
      const parsedDate = toDateOnly(date);
      const year = parsedDate.getUTCFullYear();
      const month = parsedDate.getUTCMonth() + 1;
      const monthlyRate = await monthlyRateRepository.findForMonth(employeeUserId, year, month);

      if (!monthlyRate) {
        throw new AppError(`Nao existe valor por km configurado para ${month}/${year}.`, 400);
      }

      const reimbursementPerKmApplied = toNumber(monthlyRate.reimbursementPerKm);
      const reimbursementAmount = Number((distanceRoundTripKm * reimbursementPerKmApplied).toFixed(2));

      records.push({
        employeeUserId,
        presenceDate: parsedDate,
        observation,
        distanceOneWayKm,
        distanceRoundTripKm,
        reimbursementPerKmApplied,
        reimbursementAmount
      });
    }

    await presenceRepository.createMany(records);

    for (const date of uniqueDates) {
      const parsedDate = toDateOnly(date);
      cache.delete(`presence:list:${employeeUserId}:${parsedDate.getUTCFullYear()}:${parsedDate.getUTCMonth() + 1}`);
      cache.delete(`presence:summary:${employeeUserId}:${parsedDate.getUTCFullYear()}:${parsedDate.getUTCMonth() + 1}`);
    }
    cache.deleteByPrefix('report:monthly:');

    return {
      created: records.length
    };
  },

  async summary(employeeUserId: string, month: number, year: number) {
    const cacheKey = `presence:summary:${employeeUserId}:${year}:${month}`;
    const cached = cache.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const { start, end } = getMonthBounds(month, year);
    const aggregate = await presenceRepository.aggregate(employeeUserId, start, end);

    return cache.set(cacheKey, {
      totalPresenceDays: aggregate._count.id,
      totalDistanceKm: toNumber(aggregate._sum.distanceRoundTripKm ?? 0),
      totalReimbursement: toNumber(aggregate._sum.reimbursementAmount ?? 0)
    }, READ_TTL_MS);
  },

  async updateStatus(companyId: string, presenceId: string, status: 'approved' | 'rejected') {
    const record = await presenceRepository.findById(presenceId);

    if (!record || record.employee.companyId !== companyId) {
      throw new AppError('Registro de presenca nao encontrado.', 404);
    }

    if (record.status !== 'PENDING') {
      throw new AppError('Apenas registros pendentes podem ser atualizados.', 409);
    }

    await presenceRepository.updateStatus(presenceId, status === 'approved' ? 'APPROVED' : 'REJECTED');

    const year = record.presenceDate.getUTCFullYear();
    const month = record.presenceDate.getUTCMonth() + 1;
    cache.delete(`presence:list:${record.employeeUserId}:${year}:${month}`);
    cache.delete(`presence:summary:${record.employeeUserId}:${year}:${month}`);
    cache.deleteByPrefix(`report:monthly:${companyId}:`);

    return { updated: 1 };
  },

  async updateManyPendingStatuses(companyId: string, ids: string[], status: 'approved' | 'rejected') {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      throw new AppError('Nenhum registro pendente foi informado.', 400);
    }

    const pendingRecords = await presenceRepository.findPendingByIds(companyId, uniqueIds);

    if (pendingRecords.length === 0) {
      throw new AppError('Nenhum registro pendente elegivel foi encontrado.', 404);
    }

    await presenceRepository.updateManyStatus(
      pendingRecords.map((record) => record.id),
      status === 'approved' ? 'APPROVED' : 'REJECTED'
    );

    for (const record of pendingRecords) {
      const year = record.presenceDate.getUTCFullYear();
      const month = record.presenceDate.getUTCMonth() + 1;
      cache.delete(`presence:list:${record.employeeUserId}:${year}:${month}`);
      cache.delete(`presence:summary:${record.employeeUserId}:${year}:${month}`);
    }
    cache.deleteByPrefix(`report:monthly:${companyId}:`);

    return {
      updated: pendingRecords.length
    };
  }
};
