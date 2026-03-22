import { translateEnumValue } from '@/src/lib/enum-labels';
import {
  getInitials,
  getProfileDisplayName,
  translateUserGender,
  translateUserRole,
} from '@/src/lib/identity';

describe('identity helpers', () => {
  it('returns default initials when no names are available', () => {
    expect(getInitials()).toBe('SD');
  });

  it('builds initials from trimmed names', () => {
    expect(getInitials('  ana ', ' gomez ')).toBe('AG');
  });

  it('returns an empty label when the enum value is missing', () => {
    expect(translateEnumValue({ ACTIVE: 'Activo' }, null)).toBe('');
  });

  it('translates role and gender labels', () => {
    expect(translateUserRole('PATIENT')).toBe('Paciente');
    expect(translateUserGender('FEMALE')).toBe('Femenino');
  });

  it('uses the full name when available for the profile display name', () => {
    expect(
      getProfileDisplayName({
        email: 'patient@example.com',
        firstName: 'Ana',
        id: '1',
        lastName: 'Gomez',
        role: 'PATIENT',
      }),
    ).toBe('Ana Gomez');
  });

  it('falls back to the email or the default label when the profile is incomplete', () => {
    expect(
      getProfileDisplayName({
        email: 'patient@example.com',
        firstName: ' ',
        id: '1',
        lastName: ' ',
        role: 'PATIENT',
      }),
    ).toBe('patient@example.com');

    expect(getProfileDisplayName()).toBe('Paciente');
  });
});
