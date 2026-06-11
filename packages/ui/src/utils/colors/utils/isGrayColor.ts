import { parseRgb888 } from 'ui/src/utils/colors/utils/parseRgb888'

/**
 * Determines if a color is gray (all RGB values are close to each other).
 * @param color The hex or rgb color to check
 * @returns boolean indicating if the color is gray
 */
export function isGrayColor(color: Maybe<string>): boolean {
  if (!color) {
    return false
  }

  const rgb = parseRgb888(color)
  if (!rgb) {
    return false
  }

  const { r, g, b } = rgb

  // Calculate the maximum difference between any two RGB components
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b))

  // If the max difference is less than this threshold, the color is considered gray
  return maxDiff < 10
}
