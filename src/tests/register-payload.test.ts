import { normalizeRegisterInput } from '@/src/features/patient-auth/register-payload';

const STRONG_PASSWORD = ['Abc', 'def', '1!'].join('');

describe('normalizeRegisterInput', () => {
  it('converts blank birthDate to null', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
      birthDate: '   ',
      gender: 'FEMALE',
    }, false);

    expect(result.birthDate).toBeNull();
  });

  it('trims birthDate when provided', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
      birthDate: ' 1990-08-20 ',
      gender: 'FEMALE',
    }, false);

    expect(result.birthDate).toBe('1990-08-20');
  });

  it('preserves other fields unchanged', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
      birthDate: undefined,
      gender: 'OTHER',
    }, false);

    expect(result).toEqual({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: null,
      gender: 'OTHER',
      acceptTerms: false,
    });
    expect(result).not.toHaveProperty('confirmPassword');
  });

  it('passes acceptTerms flag through', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
      birthDate: undefined,
    }, true);

    expect(result.acceptTerms).toBe(true);
  });
});
