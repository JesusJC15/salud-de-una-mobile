import { z } from 'zod';

const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const birthDateRule = /^\d{4}-\d{2}-\d{2}$/;
const emailSchema = z.string().trim().email();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().regex(passwordRule, {
    message: 'Password must include an uppercase letter, a number, and a special character.',
  }),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  birthDate: z
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .refine(
      (value) => value === undefined || birthDateRule.test(value),
      { message: 'Birth date must be in YYYY-MM-DD format.' },
    )
    .optional()
    .nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;