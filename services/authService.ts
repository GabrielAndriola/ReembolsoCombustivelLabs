import { userRepository } from '../repositories/userRepository';
import { AppError } from '../utils/app-error';
import { comparePassword } from '../utils/password';
import { serializeRole } from '../utils/serializers';
import { signToken } from '../utils/jwt';

const formatUser = (user: Awaited<ReturnType<typeof userRepository.findById>>) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: serializeRole(user.role),
    employeeId: user.employeeProfile?.employeeCode ?? '',
    team: user.employeeProfile?.department ?? '',
    supervisorName: user.employeeProfile?.supervisor?.name ?? null
  };
};

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.active) {
      throw new AppError('Credenciais invalidas.', 401);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Credenciais invalidas.', 401);
    }

    return {
      token: signToken({
        sub: user.id,
        role: serializeRole(user.role),
        companyId: user.companyId
      }),
      user: formatUser(user)
    };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user || !user.active) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    return formatUser(user);
  }
};
