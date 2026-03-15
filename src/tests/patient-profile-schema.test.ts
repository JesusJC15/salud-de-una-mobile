import { updatePatientProfileSchema } from '@/src/schemas/patient-profile';

describe('updatePatientProfileSchema', () => {
  it('accepts valid payload', () => {
    const result = updatePatientProfileSchema.safeParse({
      birthDate: '1990-08-20',
      firstName: 'Ana',
      gender: 'female',
      lastName: 'Gomez',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.gender).toBe('FEMALE');
    }
  });

  it('rejects invalid birthDate format', () => {
    const result = updatePatientProfileSchema.safeParse({ birthDate: '20/08/1990' });

    expect(result.success).toBe(false);
  });

  it('rejects invalid gender value', () => {
    const result = updatePatientProfileSchema.safeParse({ gender: 'UNKNOWN' });

    expect(result.success).toBe(false);
  });

  it('converts empty strings to undefined', () => {
    const result = updatePatientProfileSchema.parse({
      birthDate: '',
      firstName: ' ',
      gender: '',
      lastName: '',
    });

    expect(result).toEqual({
      birthDate: undefined,
      firstName: undefined,
      gender: undefined,
      lastName: undefined,
    });
  });
});
