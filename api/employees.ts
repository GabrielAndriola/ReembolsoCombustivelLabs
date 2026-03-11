import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { employeeService } from '../services/employeeService';

const router = Router();
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

const employeeSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['employee', 'supervisor', 'admin']),
  active: z.boolean().optional(),
  employeeCode: z.string().min(2),
  department: z.string().min(2),
  supervisorId: z.string().optional().nullable(),
  distanceToCompanyKm: z.number().positive(),
  distanceFromCompanyKm: z.number().positive(),
  password: z.string().min(6).optional(),
  year: z.number().int().min(2024),
  month: z.number().int().min(1).max(12),
  reimbursementPerKm: z.number().positive(),
  address: z.object({
    zipCode: z.string().min(8),
    street: z.string().min(2),
    number: z.string().min(1),
    complement: z.string().optional(),
    district: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().optional(),
    latitude: latitudeSchema.optional().nullable(),
    longitude: longitudeSchema.optional().nullable(),
    formattedAddress: z.string().min(2)
  })
});

const applyRateSchema = z.object({
  year: z.number().int().min(2024),
  month: z.number().int().min(1).max(12),
  reimbursementPerKm: z.number().positive(),
  applyToAll: z.boolean(),
  userIds: z.array(z.string().min(1)).optional()
});

const companyAddressSchema = z.object({
  zipCode: z.string().min(8),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().optional(),
  latitude: latitudeSchema.optional().nullable(),
  longitude: longitudeSchema.optional().nullable(),
  formattedAddress: z.string().min(2)
});

router.use(authenticate, requireRole('supervisor', 'admin'));

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.listEmployees(req.auth!.companyId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/rate-targets', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.listRateEligibleUsers(req.auth!.companyId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/rates/apply', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = applyRateSchema.parse(req.body);
    const result = await employeeService.applyRate(req.auth!.companyId, payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/company-address', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = companyAddressSchema.parse(req.body);
    const result = await employeeService.updateCompanyAddress(req.auth!.companyId, payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = employeeSchema.parse(req.body);
    const result = await employeeService.createEmployee(req.auth!.companyId, payload);
    res.status(201).json({ id: result.id });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.getEmployeeById(req.auth!.companyId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const payload = employeeSchema.parse(req.body);
    const result = await employeeService.updateEmployee(req.auth!.companyId, req.params.id, payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await employeeService.deleteEmployee(req.auth!.companyId, req.auth!.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
