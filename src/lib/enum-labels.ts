export function translateEnumValue(
  labels: Record<string, string>,
  value: string | undefined | null,
  options?: {
    fallback?: string;
  },
): string {
  if (!value) {
    return options?.fallback ?? '';
  }

  return labels[value] ?? options?.fallback ?? value;
}
