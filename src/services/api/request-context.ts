export function createCorrelationId() {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 10);

  return `mobile-${timestamp}-${randomSuffix}`;
}