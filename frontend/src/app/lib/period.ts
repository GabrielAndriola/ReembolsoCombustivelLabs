import type { CompanyPeriodResponse, PresenceResponse } from './api';

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

export const formatPeriodLabel = (period: CompanyPeriodResponse) =>
  `${parseDate(period.startDate).toLocaleDateString('pt-BR')} a ${parseDate(period.endDate).toLocaleDateString('pt-BR')}`;

export const countBusinessDaysElapsed = (period: CompanyPeriodResponse) => {
  const start = parseDate(period.startDate);
  const end = parseDate(period.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveEnd = end < today ? end : today;

  if (effectiveEnd < start) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);

  while (cursor <= effectiveEnd) {
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

export const countRegisteredDaysElapsed = (period: CompanyPeriodResponse, presences: PresenceResponse[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Set(
    presences
      .map((presence) => presence.presenceDate)
      .filter((date) => parseDate(date) <= today)
  ).size;
};
