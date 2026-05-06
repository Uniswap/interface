import { logger } from 'utilities/src/logger/logger'
import { hexToRGB } from 'utilities/src/theme/colors'

/**
 * Blends a color with white at a given opacity (like a white overlay).
 * This creates a lighter version of the color.
 *
 * @param whiteOpacity - Opacity of white overlay (0-1, e.g., 0.24 for 24%)
 * @param color - Base color in hex format (e.g., '#7482FF')
 * @returns Blended color in hex format
 */
function blendWithWhite(whiteOpacity: number, color: string): string {
  const rgb = hexToRGB(color)
  if (!rgb) {
    return color
  }
  const { r, g, b } = rgb

  // Blend with white (255, 255, 255) using the formula:
  // result = base * (1 - opacity) + white * opacity
  const blendR = Math.round(r * (1 - whiteOpacity) + 255 * whiteOpacity)
  const blendG = Math.round(g * (1 - whiteOpacity) + 255 * whiteOpacity)
  const blendB = Math.round(b * (1 - whiteOpacity) + 255 * whiteOpacity)

  // Convert back to hex
  const toHex = (n: number): string => n.toString(16).padStart(2, '0')
  return `#${toHex(blendR)}${toHex(blendG)}${toHex(blendB)}`
}

/** White overlay opacity for concentration band color */
const CONCENTRATION_WHITE_OPACITY = 0.24

export function getConcentrationColor({
  tokenColor,
  fallbackAccentColor,
}: {
  tokenColor: string | undefined
  fallbackAccentColor: string
}): string {
  const effectiveTokenColor = tokenColor || fallbackAccentColor
  return blendWithWhite(CONCENTRATION_WHITE_OPACITY, effectiveTokenColor)
}

interface ChartBarColors {
  clearingPriceColor: string
  concentrationColor: string
  aboveClearingPriceColor: string
  belowClearingPriceColor: string
}

/**
 * Derives chart bar colors from token color.
 * Single source of truth for bar coloring - used by both chart renderer and legend.
 */
export function getChartBarColors({
  tokenColor,
  fallbackAccentColor,
  neutralColor,
}: {
  tokenColor: string | undefined
  fallbackAccentColor: string
  neutralColor: string
}): ChartBarColors {
  const effectiveTokenColor = tokenColor || fallbackAccentColor
  const concentrationColor = getConcentrationColor({ tokenColor, fallbackAccentColor })
  return {
    clearingPriceColor: effectiveTokenColor,
    concentrationColor,
    aboveClearingPriceColor: effectiveTokenColor,
    belowClearingPriceColor: neutralColor,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Concentration gradient colors
// ─────────────────────────────────────────────────────────────────────────────

// Concentration gradient configuration
// These opacities are applied to the token color for the gradient background
const CONCENTRATION_GRADIENT_START_OPACITY = 0.1 // Bottom of gradient (10% opacity)
const CONCENTRATION_GRADIENT_END_OPACITY = 0.4 // Top of gradient (40% opacity)

/**
 * Creates gradient colors for the concentration band background based on the token color.
 * The gradient goes from a subtle token color at the bottom to a stronger presence at the top.
 *
 * @param tokenColor - The token's brand color in hex format (e.g., '#7482FF')
 * @returns Object with startColor (bottom) and endColor (top) for the gradient
 */
export function createConcentrationGradientColors(tokenColor: string): { startColor: string; endColor: string } {
  const rgb = hexToRGB(tokenColor)
  if (!rgb) {
    logger.warn('colors', 'createConcentrationGradientColors', 'Failed to parse token color', { tokenColor })
    return {
      startColor: 'rgba(0, 0, 0, 0)',
      endColor: 'rgba(0, 0, 0, 0)',
    }
  }
  const { r, g, b } = rgb

  return {
    startColor: `rgba(${r}, ${g}, ${b}, ${CONCENTRATION_GRADIENT_START_OPACITY})`,
    endColor: `rgba(${r}, ${g}, ${b}, ${CONCENTRATION_GRADIENT_END_OPACITY})`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Demand chart background gradient colors
// ─────────────────────────────────────────────────────────────────────────────

// Demand chart gradient configuration
// These opacities create per-bar background gradients (vertical: top darker → bottom transparent)
const DEMAND_GRADIENT_START_OPACITY = 0.08 // Top of gradient
const DEMAND_GRADIENT_END_OPACITY = 0.003 // Bottom of gradient (nearly transparent)

/**
 * Creates gradient colors for the demand chart per-bar background based on the token color.
 * The gradient goes from darker at the top to nearly transparent at the bottom.
 *
 * @param tokenColor - The token's brand color in hex format (e.g., '#7482FF')
 * @returns Object with startColor (top) and endColor (bottom) for the vertical gradient
 */
export function createDemandBackgroundGradient(tokenColor: string): { startColor: string; endColor: string } {
  const rgb = hexToRGB(tokenColor)
  if (!rgb) {
    logger.warn('colors', 'createDemandBackgroundGradient', 'Failed to parse token color', { tokenColor })
    return {
      startColor: 'rgba(0, 0, 0, 0)',
      endColor: 'rgba(0, 0, 0, 0)',
    }
  }
  const { r, g, b } = rgb

  return {
    startColor: `rgba(${r}, ${g}, ${b}, ${DEMAND_GRADIENT_START_OPACITY})`,
    endColor: `rgba(${r}, ${g}, ${b}, ${DEMAND_GRADIENT_END_OPACITY})`,
  }
}
