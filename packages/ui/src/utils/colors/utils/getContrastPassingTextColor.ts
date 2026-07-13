import { colorsLight } from 'ui/src/theme'
import { MIN_COLOR_CONTRAST_THRESHOLD } from 'ui/src/utils/colors/constants'
import { hex } from 'wcag-contrast'

/**
 * Picks a contrast-passing text color to put on top of a given background color.
 * @param backgroundColor The hex value of the background color to check contrast against
 * @returns either 'white' or 'black'
 */
export function getContrastPassingTextColor(backgroundColor: string): '$white' | '$black' {
  const lightText = colorsLight.white
  if (hex(lightText, backgroundColor) >= MIN_COLOR_CONTRAST_THRESHOLD) {
    return '$white'
  }
  return '$black'
}
