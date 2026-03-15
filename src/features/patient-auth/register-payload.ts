import type { RegisterInput } from '@/src/schemas/auth';
import { registerSchema } from '@/src/schemas/auth';

export function normalizeRegisterInput(input: RegisterInput): RegisterInput {
  const normalizedBirthDate = input.birthDate?.trim();

  return {
    ...input,
    birthDate: normalizedBirthDate || null,
  };
}
