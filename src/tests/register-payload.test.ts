import { normalizeRegisterInput } from '@/src/features/patient-auth/register-payload';

const STRONG_PASSWORD = ['Abc', 'def', '1!'].join('');

describe('normalizeRegisterInput', () => {
  it('converts blank birthDate to null', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: '   ',
      gender: 'FEMALE',
    });

    expect(result.birthDate).toBeNull();
  });

  it('trims birthDate when provided', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: ' 1990-08-20 ',
      gender: 'FEMALE',
    });

    expect(result.birthDate).toBe('1990-08-20');
  });

  it('defaults birthDate to null when omitted', () => {
    const result = normalizeRegisterInput({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: undefined,
      gender: 'OTHER',
    });

    expect(result).toEqual({
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: STRONG_PASSWORD,
      birthDate: null,
      gender: 'OTHER',
    });
  });
});
