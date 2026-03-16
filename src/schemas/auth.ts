import { z } from 'zod';

const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const isoDateRule = /^\d{4}-\d{2}-\d{2}$/;
const emailSchema = z.string().trim().pipe(z.email({ message: 'Ingresa un correo electrónico válido.' }));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().regex(passwordRule, {
    message: 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial.',
  }),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  birthDate: z
    .string()
    .trim()
    .regex(isoDateRule, { message: 'La fecha de nacimiento debe usar el formato YYYY-MM-DD.' })
    .nullable()
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;