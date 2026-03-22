import type { RegisterFormInput, RegisterInput } from '@/src/schemas/auth';

export function normalizeRegisterInput(input: RegisterFormInput): RegisterInput {
  const normalizedBirthDate = input.birthDate?.trim();
  const normalizedEmail = input.email.trim();

  return {
    email: normalizedEmail,
    firstName: input.firstName,
    lastName: input.lastName,
    password: input.password,
    gender: input.gender,
    birthDate: normalizedBirthDate || null,
  };
}
