import { companyPeriodRepository } from '../repositories/companyPeriodRepository';
import { cache } from '../utils/cache';

const DEFAULT_START_DAY = 1;
const DEFAULT_END_DAY = 30;
const READ_TTL_MS = 30_000;

const getDaysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const clampDay = (year: number, month: number, day: number) => {
  const daysInMonth = getDaysInMonth(year, month);
  return Math.max(1, Math.min(day, daysInMonth));
};

const buildRange = (year: number, month: number, startDay: number, endDay: number) => {
  const spansPreviousMonth = startDay !== DEFAULT_START_DAY;
  const startYear = spansPreviousMonth && month === 1 ? year - 1 : year;
  const startMonth = spansPreviousMonth ? (month === 1 ? 12 : month - 1) : month;
  const normalizedStartDay = clampDay(startYear, startMonth, startDay);
  const normalizedEndDay = clampDay(year, month, endDay);
  const startDate = new Date(Date.UTC(startYear, startMonth - 1, normalizedStartDay));
  const endDate = new Date(Date.UTC(year, month - 1, normalizedEndDay));
  const endExclusive = new Date(Date.UTC(year, month - 1, normalizedEndDay + 1));

  return {
    startDate,
    endDate,
    endExclusive,
    startDay: normalizedStartDay,
    endDay: normalizedEndDay,
    spansPreviousMonth
  };
};

export const companyPeriodService = {
  async getPeriod(companyId: string, month: number, year: number) {
    const cacheKey = `company:period:${companyId}:${year}:${month}`;
    const cached = cache.get<{
      month: number;
      year: number;
      startDay: number;
      endDay: number;
      startDate: string;
      endDate: string;
      spansPreviousMonth: boolean;
      isDefault: boolean;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const savedPeriod = await companyPeriodRepository.findByMonth(companyId, year, month);
    const configuredStartDay = savedPeriod?.startDay ?? DEFAULT_START_DAY;
    const configuredEndDay = savedPeriod?.endDay ?? DEFAULT_END_DAY;
    const range = buildRange(year, month, configuredStartDay, configuredEndDay);

    return cache.set(cacheKey, {
      month,
      year,
      startDay: configuredStartDay,
      endDay: configuredEndDay,
      startDate: range.startDate.toISOString().slice(0, 10),
      endDate: range.endDate.toISOString().slice(0, 10),
      spansPreviousMonth: range.spansPreviousMonth,
      isDefault: !savedPeriod
    }, READ_TTL_MS);
  },

  async getBounds(companyId: string, month: number, year: number) {
    const period = await this.getPeriod(companyId, month, year);
    const range = buildRange(period.year, period.month, period.startDay, period.endDay);

    return {
      ...period,
      start: range.startDate,
      end: range.endExclusive
    };
  },

  async updatePeriod(companyId: string, month: number, year: number, startDay: number, endDay: number) {
    await companyPeriodRepository.upsert(companyId, year, month, startDay, endDay);

    cache.delete(`company:period:${companyId}:${year}:${month}`);
    cache.deleteByPrefix(`report:monthly:${companyId}:${year}:${month}`);
    cache.deleteByPrefix(`employee:list:${companyId}`);
    cache.deleteByPrefix('presence:list:');
    cache.deleteByPrefix('presence:summary:');
    cache.deleteByPrefix('presence:period:');

    return this.getPeriod(companyId, month, year);
  }
};
