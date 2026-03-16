import { presenceRepository } from '../repositories/presenceRepository';
import { presenceService } from './presenceService';
import { cache } from '../utils/cache';
import { serializeStatus, toNumber } from '../utils/serializers';
import { companyPeriodService } from './companyPeriodService';

const READ_TTL_MS = 30_000;

export const reportService = {
  async monthly(companyId: string, month: number, year: number) {
    const cacheKey = `report:monthly:${companyId}:${year}:${month}`;
    const cached = cache.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { start, end } = await companyPeriodService.getBounds(companyId, month, year);
    const records = await presenceRepository.monthlyReport(companyId, start, end);

    const grouped = records.reduce<Record<string, any>>((accumulator, record) => {
      const key = record.employee.id;

      if (!accumulator[key]) {
        accumulator[key] = {
          employeeId: record.employee.id,
          employeeName: record.employee.name,
          employeeCode: record.employee.employeeProfile?.employeeCode ?? '',
          department: record.employee.employeeProfile?.department ?? '',
          totalPresenceDays: 0,
          totalDistanceKm: 0,
          totalReimbursement: 0,
          records: []
        };
      }

      accumulator[key].totalPresenceDays += 1;
      accumulator[key].totalDistanceKm += toNumber(record.distanceRoundTripKm);
      accumulator[key].totalReimbursement += toNumber(record.reimbursementAmount);
      accumulator[key].records.push({
        id: record.id,
        date: record.presenceDate.toISOString().slice(0, 10),
        status: serializeStatus(record.status),
        reimbursementAmount: toNumber(record.reimbursementAmount),
        reimbursementPerKmApplied: toNumber(record.reimbursementPerKmApplied)
      });

      return accumulator;
    }, {});

    return cache.set(cacheKey, Object.values(grouped), READ_TTL_MS);
  },

  updatePresenceStatus(companyId: string, presenceId: string, status: 'approved' | 'rejected') {
    return presenceService.updateStatus(companyId, presenceId, status);
  },

  updateManyPresenceStatuses(companyId: string, ids: string[], status: 'approved' | 'rejected') {
    return presenceService.updateManyPendingStatuses(companyId, ids, status);
  }
};
