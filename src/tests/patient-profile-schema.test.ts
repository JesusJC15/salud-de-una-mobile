import { changePasswordSchema, updatePatientProfileSchema } from '@/src/schemas/patient-profile';

describe('updatePatientProfileSchema', () => {
  it('accepts valid payload', () => {
    const result = updatePatientProfileSchema.safeParse({
      birthDate: '1990-08-20',
      firstName: 'Ana',
      gender: 'female',
      heightCm: '165',
      lastName: 'Gomez',
      weightKg: '62.5',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.gender).toBe('FEMALE');
      expect(result.data.heightCm).toBe(165);
      expect(result.data.weightKg).toBe(62.5);
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
      heightCm: '',
      lastName: '',
      weightKg: '',
    });

    expect(result).toEqual({
      birthDate: undefined,
      firstName: undefined,
      gender: undefined,
      heightCm: undefined,
      lastName: undefined,
      weightKg: undefined,
    });
  });

  it('rejects out-of-range anthropometric values', () => {
    const result = updatePatientProfileSchema.safeParse({
      heightCm: '300',
      weightKg: '0',
    });

    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts a valid password change payload', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass2!',
      confirmNewPassword: 'NewPass2!',
    });

    expect(result.success).toBe(true);
  });

  it('rejects when confirmation does not match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass2!',
      confirmNewPassword: 'Mismatch3!',
    });

    expect(result.success).toBe(false);
  });
});
