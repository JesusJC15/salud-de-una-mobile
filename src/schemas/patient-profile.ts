import { z } from 'zod';
import { passwordRule } from '@/src/schemas/auth';

const patientGenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalNumberString = (label: string, min: number, max: number) =>
  optionalTrimmedString
    .refine((value) => !value || /^\d+(\.\d+)?$/.test(value), `${label} debe ser un número.`)
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || (value >= min && value <= max), {
      message: `${label} debe estar entre ${min} y ${max}.`,
    });

export const updatePatientProfileSchema = z.object({
  firstName: optionalTrimmedString,
  lastName: optionalTrimmedString,
  birthDate: optionalTrimmedString.refine(
    (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Use formato YYYY-MM-DD.'
  ),
  gender: optionalTrimmedString
    .transform((value) => (value ? value.toUpperCase() : undefined))
    .refine((value) => !value || patientGenderValues.includes(value as (typeof patientGenderValues)[number]), {
      message: 'Valores permitidos: MALE, FEMALE, OTHER.',
    })
    .transform((value) => value as (typeof patientGenderValues)[number] | undefined),
  heightCm: optionalNumberString('La altura', 30, 260),
  weightKg: optionalNumberString('El peso', 1, 400),
});

export type UpdatePatientProfileFormInput = z.infer<typeof updatePatientProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual.'),
    newPassword: z.string().regex(passwordRule, {
      message:
        'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial.',
    }),
    confirmNewPassword: z.string().min(1, 'Confirmá la nueva contraseña.'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormInput = z.infer<typeof changePasswordSchema>;
