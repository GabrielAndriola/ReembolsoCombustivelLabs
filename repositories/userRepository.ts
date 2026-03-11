import { prisma } from '../lib/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
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
        }
      }
    });
  },

  findByEmployeeCode(employeeCode: string) {
    return prisma.employeeProfile.findUnique({
      where: {
        employeeCode
      },
      select: {
        userId: true,
        employeeCode: true
      }
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
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
        }
      }
    });
  },

  findEmployees(companyId: string) {
    return prisma.user.findMany({
      where: {
        companyId,
        role: {
          in: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN']
        }
      },
      include: {
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
      },
      orderBy: {
        name: 'asc'
      }
    });
  },

  findEmployeeById(companyId: string, userId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: {
          in: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN']
        }
      },
      include: {
        employeeProfile: {
          select: {
            employeeCode: true,
            department: true,
            distanceToCompanyKm: true,
            distanceFromCompanyKm: true,
            supervisorId: true,
            supervisor: {
              select: {
                name: true
              }
            }
          }
        },
        employeeAddresses: {
          where: { isMain: true },
          include: { address: true },
          take: 1
        },
        monthlyRates: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1
        }
      }
    });
  },

  findRateEligibleUsers(companyId: string) {
    return prisma.user.findMany({
      where: {
        companyId,
        role: {
          in: ['EMPLOYEE', 'SUPERVISOR', 'ADMIN']
        }
      },
      include: {
        employeeProfile: {
          select: {
            employeeCode: true,
            department: true
          }
        },
        monthlyRates: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1
        }
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });
  }
};
