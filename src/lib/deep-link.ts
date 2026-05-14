const ALLOWED_DEEP_LINK_PREFIXES = [
  '/followup/',
  '/triage/chat/',
  '/triage/',
  '/(tabs)',
] as const;

export function isAllowedDeepLink(deepLink: string): boolean {
  return ALLOWED_DEEP_LINK_PREFIXES.some((prefix) => deepLink.startsWith(prefix));
}
