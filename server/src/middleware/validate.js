import { z } from 'zod';
import { error } from '../utils/errors.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map(i => i.message).join('; ') || 'Invalid input.';
    return error(res, 400, msg);
  }
  req.body = result.data;
  next();
};

const emptyToUndefined = (v) => (v === '' ? undefined : v);
export const medicineCreateSchema = z.object({
  name: z.string().trim().min(1, 'Medicine name required').max(120),
  dose: z.string().trim().min(1, 'Dose required').max(80),
  schedule: z.string().trim().min(1, 'Schedule required').max(20),
  slot: z.enum(['morning','afternoon','night']),
  composition: z.string().max(500).optional().or(z.literal('')),
  uses: z.string().max(500).optional().or(z.literal('')),
  sideEffects: z.string().max(500).optional().or(z.literal('')),
  imageUrl: z.string().max(500).optional().or(z.literal('')),
  manufacturer: z.string().max(120).optional().or(z.literal('')),
  initialQuantity: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100000).optional().nullable()),
  quantityPerDose: z.string().trim().max(40).optional().or(z.literal('')),
  formType: z.enum(['oral','topical','liquid','injection']).optional(),
  specialInstructions: z.string().max(500).optional().or(z.literal('')),
  frequency: z.string().max(80).optional().or(z.literal('')),
  conditionTag: z.preprocess(emptyToUndefined, z.enum(['Blood Pressure','Diabetes','Thyroid','Antibiotics','Vitamins','Heart']).optional().nullable()),
  expiryDate: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
});

export const statusPatchSchema = z.object({
  status: z.enum(['taken','missed','snoozed','upcoming']),
  snoozeMinutes: z.coerce.number().int().min(1).max(240).optional(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(20),
  password: z.string().min(8).max(128),
  role: z.enum(['patient','caregiver']),
});
