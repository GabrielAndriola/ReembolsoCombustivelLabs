import jwt from 'jsonwebtoken';
import { env } from '../lib/env';

export interface JwtPayload {
  sub: string;
  role: 'admin' | 'supervisor' | 'employee';
  companyId: string;
}

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d'
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;
