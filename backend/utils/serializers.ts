import { PresenceStatus, UserRole } from '@prisma/client';

export const serializeRole = (role: UserRole) => role.toLowerCase() as 'admin' | 'supervisor' | 'employee';

export const serializeStatus = (status: PresenceStatus) =>
  status.toLowerCase() as 'pending' | 'approved' | 'rejected';

export const toNumber = (value: unknown) => Number(value);
