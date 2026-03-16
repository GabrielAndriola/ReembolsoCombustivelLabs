import { prisma } from '../lib/prisma';

export const companyPeriodRepository = {
  findByMonth(companyId: string, year: number, month: number) {
    return prisma.companyPeriod.findUnique({
      where: {
        companyId_year_month: {
          companyId,
          year,
          month
        }
      }
    });
  },

  upsert(companyId: string, year: number, month: number, startDay: number, endDay: number) {
    return prisma.companyPeriod.upsert({
      where: {
        companyId_year_month: {
          companyId,
          year,
          month
        }
      },
      update: {
        startDay,
        endDay
      },
      create: {
        companyId,
        year,
        month,
        startDay,
        endDay
      }
    });
  }
};
