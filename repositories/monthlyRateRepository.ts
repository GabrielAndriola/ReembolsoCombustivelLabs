import { prisma } from '../lib/prisma';

export const monthlyRateRepository = {
  findForMonth(employeeUserId: string, year: number, month: number) {
    return prisma.monthlyRate.findUnique({
      where: {
        employeeUserId_year_month: {
          employeeUserId,
          year,
          month
        }
      }
    });
  }
};
