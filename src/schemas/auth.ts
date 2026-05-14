import { z } from 'zod';

export const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const isoDateRule = /^\d{4}-\d{2}-\d{2}$/;
const emailSchema = z.string().trim().pipe(z.email({ message: 'Ingresa un correo electrónico válido.' }));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().trim().regex(passwordRule, {
    message: 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial.',
  }),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  birthDate: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    })
    .refine((value) => value == null || isoDateRule.test(value), {
      message: 'La fecha de nacimiento debe usar el formato YYYY-MM-DD.',
    }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  acceptTerms: z.boolean().optional(),
});

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().trim().min(1, 'Confirma tu contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;