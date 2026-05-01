import { Colors } from '@/src/constants/theme';

export function useThemeColor(
  props: { light?: string },
  colorName: keyof typeof Colors.light,
) {
  return props.light ?? Colors.light[colorName];
}
