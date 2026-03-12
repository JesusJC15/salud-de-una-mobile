import { z } from 'zod';

const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().regex(passwordRule, {
    message: 'Password must include an uppercase letter, a number, and a special character.',
  }),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  birthDate: z.string().trim().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;