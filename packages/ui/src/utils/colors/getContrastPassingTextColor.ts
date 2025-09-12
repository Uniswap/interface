import { colorsLight } from 'ui/src/theme'
import { hex } from 'wcag-contrast'

/*
 The WCAG AA minimum color contrast threshold standard requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. Large text is defined as 14 point (typically 18.66px) and bold or larger, or 18 point (typically 24px) or larger.
 */
export const MIN_COLOR_CONTRAST_THRESHOLD = 3

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
