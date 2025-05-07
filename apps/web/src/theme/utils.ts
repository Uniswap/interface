import { mix } from 'polished'
import { colors } from 'theme/colors'
import { hex } from 'wcag-contrast'

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
