import { prisma } from '../lib/prisma';
import { employeeRepository } from '../repositories/employeeRepository';
import { userRepository } from '../repositories/userRepository';
import { companyRepository } from '../repositories/companyRepository';
import { AppError } from '../utils/app-error';
import { cache } from '../utils/cache';
import { hashPassword } from '../utils/password';
import { serializeRole, toNumber } from '../utils/serializers';

const READ_TTL_MS = 30_000;

const formatAddress = (addressJoin?: { address: any } | null) => {
  if (!addressJoin?.address) {
    return null;
  }

  return {
    id: addressJoin.address.id,
    zipCode: addressJoin.address.zipCode,
    street: addressJoin.address.street,
    number: addressJoin.address.number,
    complement: addressJoin.address.complement,
    district: addressJoin.address.district,
    city: addressJoin.address.city,
    state: addressJoin.address.state,
    country: addressJoin.address.country,
    latitude: addressJoin.address.latitude == null ? null : toNumber(addressJoin.address.latitude),
    longitude: addressJoin.address.longitude == null ? null : toNumber(addressJoin.address.longitude),
    formattedAddress: addressJoin.address.formattedAddress
  };
};

const getTotalDailyDistanceKm = (profile?: {
  distanceToCompanyKm?: unknown;
  distanceFromCompanyKm?: unknown;
} | null) => {
  const distanceToCompanyKm =
    profile?.distanceToCompanyKm == null ? null : toNumber(profile.distanceToCompanyKm);
  const distanceFromCompanyKm =
    profile?.distanceFromCompanyKm == null ? null : toNumber(profile.distanceFromCompanyKm);

  if (distanceToCompanyKm == null || distanceFromCompanyKm == null) {
    return {
      distanceToCompanyKm,
      distanceFromCompanyKm,
      totalDailyDistanceKm: null
    };
  }

  return {
    distanceToCompanyKm,
    distanceFromCompanyKm,
    totalDailyDistanceKm: Number((distanceToCompanyKm + distanceFromCompanyKm).toFixed(2))
  };
};

export const employeeService = {
  async getProfile(userId: string) {
    const cacheKey = `employee:profile:${userId}`;
    const cached = cache.get<Awaited<ReturnType<typeof this.getProfile>>>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await employeeRepository.getProfile(userId);

    if (!user) {
      throw new AppError('Perfil nao encontrado.', 404);
    }

    return cache.set(cacheKey, {
      ...getTotalDailyDistanceKm(user.employeeProfile),
      id: user.id,
      name: user.name,
      email: user.email,
      role: serializeRole(user.role),
      employeeCode: user.employeeProfile?.employeeCode ?? null,
      department: user.employeeProfile?.department ?? null,
      supervisorName: user.employeeProfile?.supervisor?.name ?? null,
      company: {
        id: user.company.id,
        name: user.company.name
      },
      companyAddress: formatAddress(user.company.companyAddresses[0]),
      homeAddress: formatAddress(user.employeeAddresses[0]),
      monthlyRates: user.monthlyRates.map((rate) => ({
        year: rate.year,
        month: rate.month,
        reimbursementPerKm: toNumber(rate.reimbursementPerKm)
      }))
    }, READ_TTL_MS);
  },

  async listEmployees(companyId: string) {
    const cacheKey = `employee:list:${companyId}`;
    const cached = cache.get<Awaited<ReturnType<typeof this.listEmployees>>>(cacheKey);

    if (cached) {
      return cached;
    }

    const employees = await userRepository.findEmployees(companyId);

    return cache.set(cacheKey, employees.map((user) => ({
      ...getTotalDailyDistanceKm(user.employeeProfile),
      id: user.id,
      name: user.name,
      email: user.email,
      role: serializeRole(user.role),
      active: user.active,
      employeeCode: user.employeeProfile?.employeeCode ?? '',
      department: user.employeeProfile?.department ?? '',
      supervisorName: user.employeeProfile?.supervisor?.name ?? null,
      reimbursementPerKm: user.monthlyRates[0] ? toNumber(user.monthlyRates[0].reimbursementPerKm) : null,
      reimbursementRateMonth: user.monthlyRates[0]?.month ?? null,
      reimbursementRateYear: user.monthlyRates[0]?.year ?? null,
      homeAddress: formatAddress(user.employeeAddresses[0])
    })), READ_TTL_MS);
  },

  async listRateEligibleUsers(companyId: string) {
    const users = await userRepository.findRateEligibleUsers(companyId);

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: serializeRole(user.role),
      active: user.active,
      employeeCode: user.employeeProfile?.employeeCode ?? '',
      department: user.employeeProfile?.department ?? '',
      reimbursementPerKm: user.monthlyRates[0] ? toNumber(user.monthlyRates[0].reimbursementPerKm) : null
    }));
  },

  async getEmployeeById(companyId: string, employeeId: string) {
    const employees = await this.listEmployees(companyId);
    const employee = employees.find((item) => item.id === employeeId);

    if (!employee) {
      throw new AppError('Funcionario nao encontrado.', 404);
    }

    return employee;
  },

  async createEmployee(companyId: string, payload: any) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedEmployeeCode = payload.employeeCode.trim().toUpperCase();
    const [existingUserByEmail, existingProfileByEmployeeCode] = await Promise.all([
      userRepository.findByEmail(normalizedEmail),
      userRepository.findByEmployeeCode(normalizedEmployeeCode)
    ]);

    if (existingUserByEmail) {
      throw new AppError('Ja existe um funcionario com esse e-mail.', 409);
    }

    if (existingProfileByEmployeeCode) {
      throw new AppError('Ja existe um funcionario com essa matricula.', 409);
    }

    const passwordHash = await hashPassword(payload.password ?? '12345678');

    return prisma.$transaction(async (transaction) => {
      const address = await transaction.address.create({
        data: {
          zipCode: payload.address.zipCode,
          street: payload.address.street,
          number: payload.address.number,
          complement: payload.address.complement,
          district: payload.address.district,
          city: payload.address.city,
          state: payload.address.state,
          country: payload.address.country ?? 'Brasil',
          latitude: payload.address.latitude ?? null,
          longitude: payload.address.longitude ?? null,
          formattedAddress: payload.address.formattedAddress
        }
      });

      const user = await transaction.user.create({
        data: {
          companyId,
          name: payload.name,
          email: normalizedEmail,
          passwordHash,
          role: payload.role.toUpperCase(),
          active: payload.active ?? true,
          employeeProfile: {
            create: {
              employeeCode: normalizedEmployeeCode,
              department: payload.department,
              supervisorId: payload.supervisorId ?? null,
              distanceToCompanyKm: payload.distanceToCompanyKm,
              distanceFromCompanyKm: payload.distanceFromCompanyKm
            }
          },
          employeeAddresses: {
            create: {
              addressId: address.id,
              isMain: true
            }
          },
          monthlyRates: {
            create: {
              year: payload.year,
              month: payload.month,
              reimbursementPerKm: payload.reimbursementPerKm
            }
          }
        }
      });

      cache.deleteByPrefix(`employee:list:${companyId}`);
      cache.deleteByPrefix('report:monthly:');

      return user;
    });
  },

  async updateEmployee(companyId: string, employeeId: string, payload: any) {
    const existingEmployee = await userRepository.findEmployeeById(companyId, employeeId);

    if (!existingEmployee?.employeeProfile) {
      throw new AppError('Funcionario nao encontrado.', 404);
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedEmployeeCode = payload.employeeCode.trim().toUpperCase();
    const [existingUserByEmail, existingProfileByEmployeeCode] = await Promise.all([
      userRepository.findByEmail(normalizedEmail),
      userRepository.findByEmployeeCode(normalizedEmployeeCode)
    ]);

    if (existingUserByEmail && existingUserByEmail.id !== employeeId) {
      throw new AppError('Ja existe um funcionario com esse e-mail.', 409);
    }

    if (existingProfileByEmployeeCode && existingProfileByEmployeeCode.userId !== employeeId) {
      throw new AppError('Ja existe um funcionario com essa matricula.', 409);
    }

    const rateYear = payload.year ?? existingEmployee.monthlyRates[0]?.year ?? new Date().getUTCFullYear();
    const rateMonth = payload.month ?? existingEmployee.monthlyRates[0]?.month ?? new Date().getUTCMonth() + 1;
    const passwordHash = payload.password ? await hashPassword(payload.password) : null;

    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: employeeId },
        data: {
          name: payload.name,
          email: normalizedEmail,
          role: payload.role.toUpperCase(),
          active: payload.active ?? true,
          ...(passwordHash ? { passwordHash } : {})
        }
      });

      await transaction.employeeProfile.update({
        where: { userId: employeeId },
        data: {
          employeeCode: normalizedEmployeeCode,
          department: payload.department,
          supervisorId: payload.supervisorId ?? null,
          distanceToCompanyKm: payload.distanceToCompanyKm,
          distanceFromCompanyKm: payload.distanceFromCompanyKm
        }
      });

      const mainAddress = existingEmployee.employeeAddresses[0]?.address;

      if (!mainAddress) {
        throw new AppError('Endereco principal do funcionario nao encontrado.', 400);
      }

      await transaction.address.update({
        where: { id: mainAddress.id },
        data: {
          zipCode: payload.address.zipCode,
          street: payload.address.street,
          number: payload.address.number,
          complement: payload.address.complement,
          district: payload.address.district,
          city: payload.address.city,
          state: payload.address.state,
          country: payload.address.country ?? 'Brasil',
          latitude: payload.address.latitude ?? null,
          longitude: payload.address.longitude ?? null,
          formattedAddress: payload.address.formattedAddress
        }
      });

      await transaction.monthlyRate.upsert({
        where: {
          employeeUserId_year_month: {
            employeeUserId: employeeId,
            year: rateYear,
            month: rateMonth
          }
        },
        update: {
          reimbursementPerKm: payload.reimbursementPerKm
        },
        create: {
          employeeUserId: employeeId,
          year: rateYear,
          month: rateMonth,
          reimbursementPerKm: payload.reimbursementPerKm
        }
      });
    });

    cache.deleteByPrefix(`employee:list:${companyId}`);
    cache.delete(`employee:profile:${employeeId}`);
    cache.deleteByPrefix(`report:monthly:${companyId}:`);
    cache.deleteByPrefix(`presence:list:${employeeId}:`);
    cache.deleteByPrefix(`presence:summary:${employeeId}:`);

    return this.getEmployeeById(companyId, employeeId);
  },

  async deleteEmployee(companyId: string, currentUserId: string, employeeId: string) {
    if (currentUserId === employeeId) {
      throw new AppError('Voce nao pode excluir o proprio usuario.', 400);
    }

    const existingEmployee = await userRepository.findEmployeeById(companyId, employeeId);

    if (!existingEmployee) {
      throw new AppError('Funcionario nao encontrado.', 404);
    }

    const addressIds = existingEmployee.employeeAddresses.map((item) => item.address.id);

    await prisma.$transaction(async (transaction) => {
      await transaction.employeeProfile.updateMany({
        where: {
          supervisorId: employeeId
        },
        data: {
          supervisorId: null
        }
      });

      await transaction.user.delete({
        where: {
          id: employeeId
        }
      });

      if (addressIds.length > 0) {
        await transaction.address.deleteMany({
          where: {
            id: {
              in: addressIds
            },
            employeeAddresses: {
              none: {}
            },
            companyAddresses: {
              none: {}
            }
          }
        });
      }
    });

    cache.deleteByPrefix(`employee:list:${companyId}`);
    cache.delete(`employee:profile:${employeeId}`);
    cache.deleteByPrefix(`report:monthly:${companyId}:`);
    cache.deleteByPrefix(`presence:list:${employeeId}:`);
    cache.deleteByPrefix(`presence:summary:${employeeId}:`);

    return {
      deleted: true
    };
  },

  async applyRate(companyId: string, payload: {
    year: number;
    month: number;
    reimbursementPerKm: number;
    applyToAll: boolean;
    userIds?: string[];
  }) {
    const eligibleUsers = await userRepository.findRateEligibleUsers(companyId);
    const targetIds = payload.applyToAll
      ? eligibleUsers.map((user) => user.id)
      : eligibleUsers
          .filter((user) => payload.userIds?.includes(user.id))
          .map((user) => user.id);

    if (targetIds.length === 0) {
      throw new AppError('Nenhum usuario elegivel foi selecionado para atualizar a tarifa.', 400);
    }

    await prisma.$transaction(
      targetIds.map((employeeUserId) =>
        prisma.monthlyRate.upsert({
          where: {
            employeeUserId_year_month: {
              employeeUserId,
              year: payload.year,
              month: payload.month
            }
          },
          update: {
            reimbursementPerKm: payload.reimbursementPerKm
          },
          create: {
            employeeUserId,
            year: payload.year,
            month: payload.month,
            reimbursementPerKm: payload.reimbursementPerKm
          }
        })
      )
    );

    cache.deleteByPrefix(`employee:list:${companyId}`);
    cache.deleteByPrefix(`report:monthly:${companyId}:`);

    for (const targetId of targetIds) {
      cache.delete(`employee:profile:${targetId}`);
      cache.delete(`presence:summary:${targetId}:${payload.year}:${payload.month}`);
    }

    return {
      updated: targetIds.length
    };
  },

  async updateCompanyAddress(companyId: string, payload: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    formattedAddress: string;
  }) {
    const mainAddress = await companyRepository.getMainAddress(companyId);

    if (!mainAddress?.address) {
      throw new AppError('Endereco principal da empresa nao encontrado.', 404);
    }

    const updatedAddress = await companyRepository.updateMainAddress(companyId, mainAddress.address.id, {
      zipCode: payload.zipCode,
      street: payload.street,
      number: payload.number,
      complement: payload.complement,
      district: payload.district,
      city: payload.city,
      state: payload.state,
      country: payload.country ?? 'Brasil',
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      formattedAddress: payload.formattedAddress
    });

    cache.deleteByPrefix(`employee:list:${companyId}`);
    cache.deleteByPrefix('employee:profile:');
    cache.deleteByPrefix(`report:monthly:${companyId}:`);

    return {
      id: updatedAddress.id,
      zipCode: updatedAddress.zipCode,
      street: updatedAddress.street,
      number: updatedAddress.number,
      complement: updatedAddress.complement,
      district: updatedAddress.district,
      city: updatedAddress.city,
      state: updatedAddress.state,
      country: updatedAddress.country,
      latitude: updatedAddress.latitude == null ? null : toNumber(updatedAddress.latitude),
      longitude: updatedAddress.longitude == null ? null : toNumber(updatedAddress.longitude),
      formattedAddress: updatedAddress.formattedAddress
    };
  }
};
