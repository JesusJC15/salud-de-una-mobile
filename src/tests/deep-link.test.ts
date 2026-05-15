import { isAllowedDeepLink } from '@/src/lib/deep-link';

describe('isAllowedDeepLink', () => {
  it.each([
    ['/followup/abc123', true],
    ['/followup/', true],
    ['/consultations/abc123', true],
    ['/consultations/', true],
    ['/triage/chat/consultation-id', true],
    ['/triage/specialty', true],
    ['/triage/', true],
    ['/(tabs)', true],
    ['/(tabs)/history', true],
    ['/(tabs)/notifications', true],
  ])('allows safe route: %s', (deepLink, expected) => {
    expect(isAllowedDeepLink(deepLink)).toBe(expected);
  });

  it.each([
    ['https://malicious.com/steal'],
    ['http://attacker.io'],
    ['javascript:alert(1)'],
    ['/(admin)/users'],
    ['/admin/dashboard'],
    [''],
    ['../(auth)/login'],
  ])('blocks unsafe route: %s', (deepLink) => {
    expect(isAllowedDeepLink(deepLink)).toBe(false);
  });
});
