import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { employeeService } from '../services/employeeService';
import { presenceService } from '../services/presenceService';

const router = Router();

const periodSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2024).max(2100)
});

const createPresencesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  observation: z.string().max(300).optional().or(z.literal(''))
});

router.use(authenticate, requireRole('employee', 'supervisor', 'admin'));

router.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.getProfile(req.auth!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = periodSchema.parse(req.query);
    const [profile, presences] = await Promise.all([
      employeeService.getProfile(req.auth!.userId),
      presenceService.list(req.auth!.userId, query.month, query.year)
    ]);

    const summary = presences.reduce(
      (accumulator, presence) => ({
        totalPresenceDays: accumulator.totalPresenceDays + 1,
        totalDistanceKm: accumulator.totalDistanceKm + presence.distanceRoundTripKm,
        totalReimbursement: accumulator.totalReimbursement + presence.reimbursementAmount
      }),
      {
        totalPresenceDays: 0,
        totalDistanceKm: 0,
        totalReimbursement: 0
      }
    );

    res.json({
      profile,
      presences,
      summary
    });
  } catch (error) {
    next(error);
  }
});

router.get('/presences', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = periodSchema.parse(req.query);
    const result = await presenceService.list(req.auth!.userId, query.month, query.year);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/presences', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = createPresencesSchema.parse(req.body);
    const result = await presenceService.create(
      req.auth!.userId,
      req.auth!.companyId,
      payload.dates,
      payload.observation || undefined
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = periodSchema.parse(req.query);
    const result = await presenceService.summary(req.auth!.userId, query.month, query.year);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
