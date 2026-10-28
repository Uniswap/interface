import type { TokenColorOverrides } from '@universe/mycelium'

/** The data API's curated `TokenProject.colors`, or undefined when it serves none (most tokens). */
export function formatColorOverrides(
  colors: { light?: string; dark?: string } | undefined,
): TokenColorOverrides | undefined {
  if (!colors?.light || !colors.dark) {
    return undefined
  }
  return { light: colors.light, dark: colors.dark }
}
