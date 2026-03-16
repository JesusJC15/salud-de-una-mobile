import type { RegisterInput } from '@/src/schemas/auth';

export function normalizeRegisterInput(input: RegisterInput): RegisterInput {
  const normalizedBirthDate = input.birthDate?.trim();
  const normalizedEmail = input.email.trim();

  return {
    ...input,
    email: normalizedEmail,
    birthDate: normalizedBirthDate || null,
  };
}
