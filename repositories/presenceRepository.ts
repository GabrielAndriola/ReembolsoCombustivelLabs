import { prisma } from '../lib/prisma';

export const presenceRepository = {
  findMany(employeeUserId: string, start: Date, end: Date) {
    return prisma.presenceRecord.findMany({
      where: {
        employeeUserId,
        presenceDate: {
          gte: start,
          lt: end
        }
      },
      orderBy: {
        presenceDate: 'asc'
      }
    });
  },

  findByDate(employeeUserId: string, presenceDate: Date) {
    return prisma.presenceRecord.findUnique({
      where: {
        employeeUserId_presenceDate: {
          employeeUserId,
          presenceDate
        }
      }
    });
  },

  findById(id: string) {
    return prisma.presenceRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            employeeProfile: {
              select: {
                employeeCode: true,
                department: true
              }
            }
          }
        }
      }
    });
  },

  createMany(records: {
    employeeUserId: string;
    presenceDate: Date;
    observation?: string;
    distanceOneWayKm: number;
    distanceRoundTripKm: number;
    reimbursementPerKmApplied: number;
    reimbursementAmount: number;
  }[]) {
    return prisma.presenceRecord.createMany({
      data: records
    });
  },

  aggregate(employeeUserId: string, start: Date, end: Date) {
    return prisma.presenceRecord.aggregate({
      where: {
        employeeUserId,
        presenceDate: {
          gte: start,
          lt: end
        }
      },
      _sum: {
        distanceRoundTripKm: true,
        reimbursementAmount: true
      },
      _count: {
        id: true
      }
    });
  },

  monthlyReport(companyId: string, start: Date, end: Date) {
    return prisma.presenceRecord.findMany({
      where: {
        employee: {
          companyId
        },
        presenceDate: {
          gte: start,
          lt: end
        }
      },
      include: {
        employee: {
          include: {
            employeeProfile: {
              select: {
                employeeCode: true,
                department: true
              }
            }
          }
        }
      },
      orderBy: [{ employee: { name: 'asc' } }, { presenceDate: 'asc' }]
    });
  },

  updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    return prisma.presenceRecord.update({
      where: { id },
      data: { status }
    });
  },

  findPendingByIds(companyId: string, ids: string[]) {
    return prisma.presenceRecord.findMany({
      where: {
        id: { in: ids },
        status: 'PENDING',
        employee: {
          companyId
        }
      },
      select: {
        id: true,
        employeeUserId: true,
        presenceDate: true
      }
    });
  },

  updateManyStatus(ids: string[], status: 'APPROVED' | 'REJECTED') {
    return prisma.presenceRecord.updateMany({
      where: {
        id: { in: ids }
      },
      data: { status }
    });
  }
};
