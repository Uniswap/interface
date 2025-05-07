import { mix } from 'polished'
import { colors } from 'theme/colors'
import { hex } from 'wcag-contrast'

/**
 * Add opacity information to a hex color
 * @param amount opacity value from 0 to 100
 * @param hexColor
 */
export function opacify(amount: number, hexColor: string): string {
  if (!hexColor.startsWith('#')) {
    return hexColor
  }

  let normalizedHexColor = hexColor

  // Expand short hex code to full form
  if (hexColor.length === 4) {
    normalizedHexColor = '#' + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2] + hexColor[3] + hexColor[3]
  }

  if (normalizedHexColor.length !== 7) {
    throw new Error(`opacify: provided color ${hexColor} was not in hexadecimal format (e.g. #000000 or #000)`)
  }

  if (amount < 0 || amount > 100) {
    throw new Error('opacify: provided amount should be between 0 and 100')
  }

  const opacityHex = Math.round((amount / 100) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${normalizedHexColor}${opacityHex}`
}

// The WCAG AA standard color contrast threshold
const MIN_COLOR_CONTRAST_THRESHOLD = 1.95

/**
 * Compares a given color against the background color to determine if it passes the minimum contrast threshold.
 * @param color The hex value of the extracted color
 * @param backgroundColor The hex value of the background color to check contrast against
 * @returns boolean value indicating if the color passes the contrast threshold
 */
export function passesContrast(color: string, backgroundColor: string): boolean {
  const contrast = hex(color, backgroundColor)
  return contrast >= MIN_COLOR_CONTRAST_THRESHOLD
}

/**
 * Compares a given color against white to determine if it passes the minimum contrast threshold.
 * @param color The hex value of the extracted color
 * @param accent1 The hex value of the background color to check contrast against
 * @returns white if the color passes the contrast threshold, otherwise black
 */
export function getNeutralContrast(accent1: string) {
  return passesContrast(accent1, colors.white) ? colors.white : colors.black
}

/**
 * Returns an accent2 value by mixing the given accent1 and surface1.
 */
export function getAccent2(accent1: string, surface1: string) {
  return mix(0.12, accent1, surface1)
}
