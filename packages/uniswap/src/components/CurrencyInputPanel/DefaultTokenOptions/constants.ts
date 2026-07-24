import { isHoverable, isWebAppDesktop } from '@universe/environment'
import { iconSizes, spacing } from 'ui/src/theme'

/**
 * If we show more than 6 tokens, we may need to add more animation delays
 */
export const MAX_NUMBER_OF_TOKENS = isWebAppDesktop ? 5 : 4

/** Overlapping arrow icon in the CurrencyInputPanel */
const ARROW_ICON_SIZE = iconSizes.icon24

/**
 * The scale of the hover animation for the token icons
 */
export const WEB_HOVER_SCALE = 1.1

// TODO: unsure of the implications of pulling this out of the scope of a React FC; potentially make this `getLogoSize` and use in the scope of a React FC
export const logoSize = isWebAppDesktop ? iconSizes.icon20 : iconSizes.icon24

export const extraMarginForHoverAnimation = isHoverable ? Math.ceil(logoSize * (WEB_HOVER_SCALE - 1)) : 0

export function getDefaultTokenOptionsCount(headerWidth: number): number {
  if (headerWidth <= 0) {
    return MAX_NUMBER_OF_TOKENS
  }

  const tokenItemWidth = logoSize + spacing.spacing4 * 2
  const availableWidth = headerWidth / 2 - ARROW_ICON_SIZE / 2 - spacing.spacing8

  return Math.min(
    MAX_NUMBER_OF_TOKENS,
    Math.max(0, Math.floor((availableWidth + spacing.spacing4) / (tokenItemWidth + spacing.spacing4))),
  )
}

// number of times i've used this comment to restart a CI: 7
