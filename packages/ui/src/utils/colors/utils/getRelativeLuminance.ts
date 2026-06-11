import { parseRgb888 } from 'ui/src/utils/colors/utils/parseRgb888'

/** WCAG 2.1 relative luminance in [0, 1], or null if the color format is unsupported. */
export function getRelativeLuminance(color: Maybe<string>): number | null {
  if (!color) {
    return null
  }

  const rgb = parseRgb888(color)
  if (!rgb) {
    return null
  }

  const toLinear = (channel: number): number => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  const R = toLinear(rgb.r)
  const G = toLinear(rgb.g)
  const B = toLinear(rgb.b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}
