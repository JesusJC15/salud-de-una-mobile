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
    message: 'La contraseña debe tener al menos una letra mayúscula, un número y un carácter especial.',
  }),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  birthDate: z
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .refine(
      (value) => value === undefined || birthDateRule.test(value),
      { message: 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.' },
    )
    .nullish(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;