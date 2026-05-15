import { translateEnumValue } from '@/src/lib/enum-labels';

describe('translateEnumValue', () => {
  it('returns empty string when value is missing', () => {
    expect(translateEnumValue({ PATIENT: 'Paciente' }, null)).toBe('');
  });

  it('returns label when mapping exists', () => {
    expect(translateEnumValue({ PATIENT: 'Paciente' }, 'PATIENT')).toBe('Paciente');
  });

  it('falls back to the original value when mapping is missing', () => {
    expect(translateEnumValue({ PATIENT: 'Paciente' }, 'ADMIN')).toBe('ADMIN');
  });

  it('supports explicit fallback text when mapping is missing', () => {
    expect(translateEnumValue({ PATIENT: 'Paciente' }, 'ADMIN', { fallback: 'No especificado' })).toBe('No especificado');
  });
});
