export function translateEnumValue(
  labels: Record<string, string>,
  value: string | undefined | null
): string {
  if (!value) {
    return '';
  }

  return labels[value] ?? value;
}
