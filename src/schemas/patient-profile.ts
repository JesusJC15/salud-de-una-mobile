import { z } from 'zod';

const patientGenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

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
});

  export type UpdatePatientProfileFormValues = z.input<typeof updatePatientProfileSchema>;
  export type UpdatePatientProfileFormInput = z.output<typeof updatePatientProfileSchema>;
