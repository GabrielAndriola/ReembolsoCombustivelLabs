import { prisma } from '../lib/prisma';

export const employeeRepository = {
  getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            companyAddresses: {
              where: { isMain: true },
              include: { address: true },
              take: 1
            }
          }
        },
        employeeProfile: {
          select: {
            employeeCode: true,
            department: true,
            distanceToCompanyKm: true,
            distanceFromCompanyKm: true,
            supervisor: {
              select: {
                name: true
              }
            }
          }
        },
        employeeAddresses: {
          where: { isMain: true },
          include: { address: true }
        },
        monthlyRates: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1
        }
      }
    });
  },

  getMainAddress(userId: string) {
    return prisma.employeeAddress.findFirst({
      where: {
        employeeUserId: userId,
        isMain: true
      },
      include: {
        address: true
      }
    });
  }
};
