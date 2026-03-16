import { prisma } from '../lib/prisma';

export const monthlyRateRepository = {
  findLatest(employeeUserId: string) {
    return prisma.monthlyRate.findFirst({
      where: {
        employeeUserId
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
  }
};
