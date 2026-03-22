import { describe, expect, it } from '@jest/globals';

import { loginSchema, registerFormSchema, registerSchema } from '@/src/schemas/auth';

const STRONG_PASSWORD = ['Abc', 'def', '1!'].join('');
const OTHER_STRONG_PASSWORD = ['Xyz', 'uvw', '2@'].join('');
const WEAK_PASSWORD = 'abc'.repeat(2) + 'gh';

describe('auth schemas', () => {
  it('loginSchema trims email and accepts valid payload', () => {
    const parsed = loginSchema.parse({
      email: '  paciente@example.com  ',
      password: STRONG_PASSWORD,
    });

    expect(parsed).toEqual({
      email: 'paciente@example.com',
      password: STRONG_PASSWORD,
    });
  });

  it('registerSchema trims email and names', () => {
    const parsed = registerSchema.parse({
      email: '  paciente@example.com  ',
      firstName: '  Ana  ',
      lastName: '  Gomez  ',
      password: STRONG_PASSWORD,
    });

    expect(parsed.email).toBe('paciente@example.com');
    expect(parsed.firstName).toBe('Ana');
    expect(parsed.lastName).toBe('Gomez');
  });

  it('registerSchema rejects weak password without required complexity', () => {
    const result = registerSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: WEAK_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('registerSchema rejects invalid gender', () => {
    const result = registerSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      gender: 'UNKNOWN',
    });

    expect(result.success).toBe(false);
  });

  it('registerSchema accepts omitted optional birthDate and gender', () => {
    const parsed = registerSchema.parse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
    });

    expect(parsed.birthDate).toBeUndefined();
    expect(parsed.gender).toBeUndefined();
  });

  it('registerSchema normalizes empty or whitespace birthDate to undefined', () => {
    const parsed = registerSchema.parse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: '   ',
    });

    expect(parsed.birthDate).toBeUndefined();
  });

  it('registerSchema accepts birthDate as null', () => {
    const parsed = registerSchema.parse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: null,
    });

    expect(parsed.birthDate).toBeNull();
  });

  it('registerSchema accepts birthDate in YYYY-MM-DD format', () => {
    const parsed = registerSchema.parse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: ' 1990-08-20 ',
    });

    expect(parsed.birthDate).toBe('1990-08-20');
  });

  it('registerSchema rejects invalid birthDate format', () => {
    const result = registerSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: '20/08/1990',
    });

    expect(result.success).toBe(false);
  });

  it('registerFormSchema requires confirmPassword', () => {
    const result = registerFormSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('registerFormSchema rejects when password confirmation does not match', () => {
    const result = registerFormSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: OTHER_STRONG_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('registerFormSchema treats whitespace-only confirmPassword as missing (required error)', () => {
    const result = registerFormSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordErrors = result.error.issues.filter(
        (issue) => issue.path[0] === 'confirmPassword',
      );
      expect(confirmPasswordErrors[0].message).toBe('Confirma tu contraseña.');
    }
  });

  it('registerSchema trims password before validating complexity', () => {
    const result = registerSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: `  ${STRONG_PASSWORD}  `,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.password).toBe(STRONG_PASSWORD);
    }
  });

  it('registerFormSchema accepts matching passwords with surrounding whitespace', () => {
    const result = registerFormSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: `  ${STRONG_PASSWORD}  `,
      confirmPassword: `  ${STRONG_PASSWORD}  `,
    });

    expect(result.success).toBe(true);
  });

  it('registerFormSchema accepts matching confirmPassword', () => {
    const result = registerFormSchema.safeParse({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    });

    expect(result.success).toBe(true);
  });
});
