import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { employeeService } from '../services/employeeService';
import { companyPeriodService } from '../services/companyPeriodService';
import { reportService } from '../services/reportService';

const router = Router();

const reportSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2024).max(2100)
});

const updatePresenceStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'])
});

const bulkUpdatePresenceStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['approved', 'rejected'])
});

const updatePeriodSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2024).max(2100),
  startDay: z.coerce.number().min(1).max(31),
  endDay: z.coerce.number().min(1).max(31)
});

router.use(authenticate, requireRole('supervisor', 'admin'));

router.get('/monthly', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = reportSchema.parse(req.query);
    const result = await reportService.monthly(req.auth!.companyId, query.month, query.year);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/overview', async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = reportSchema.parse(req.query);
    const [employees, report, period] = await Promise.all([
      employeeService.listEmployees(req.auth!.companyId),
      reportService.monthly(req.auth!.companyId, query.month, query.year),
      companyPeriodService.getPeriod(req.auth!.companyId, query.month, query.year)
    ]);

    res.json({
      employees,
      report,
      period
    });
  } catch (error) {
    next(error);
  }
});

router.put('/period', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = updatePeriodSchema.parse(req.body);
    const result = await companyPeriodService.updatePeriod(
      req.auth!.companyId,
      payload.month,
      payload.year,
      payload.startDay,
      payload.endDay
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/presences/:id/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = updatePresenceStatusSchema.parse(req.body);
    const result = await reportService.updatePresenceStatus(req.auth!.companyId, req.params.id, payload.status);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/presences/bulk-status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = bulkUpdatePresenceStatusSchema.parse(req.body);
    const result = await reportService.updateManyPresenceStatuses(req.auth!.companyId, payload.ids, payload.status);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
