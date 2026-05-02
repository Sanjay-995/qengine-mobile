import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

type Palette = typeof colors.light;

/**
 * Returns the design tokens for the current color scheme.
 *
 * Falls back to the light palette when no dark key is defined in
 * constants/colors.ts. When a sibling web artifact's dark tokens are
 * synced into a `dark` key, this hook will automatically switch palettes
 * based on the device's appearance setting.
 */
export function useColors(): Palette & { radius: number } {
  const scheme = useColorScheme();
  const hasDark = "dark" in colors && typeof (colors as { dark?: unknown }).dark === "object";
  const palette: Palette =
    scheme === "dark" && hasDark
      ? ((colors as unknown as { dark: Palette }).dark)
      : colors.light;
  return { ...palette, radius: colors.radius };
}
