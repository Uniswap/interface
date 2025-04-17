import { iconSizes } from 'ui/src/theme'
import { isHoverable, isInterfaceDesktop } from 'utilities/src/platform'

/**
 * If we show more than 6 tokens, we may need to add more animation delays
 */
export const MAX_NUMBER_OF_TOKENS = isInterfaceDesktop ? 5 : 4

/**
 * The scale of the hover animation for the token icons
 */
export const WEB_HOVER_SCALE = 1.1

// TODO: unsure of the implications of pulling this out of the scope of a React FC; potentially make this `getLogoSize` and use in the scope of a React FC
export const logoSize = isInterfaceDesktop ? iconSizes.icon20 : iconSizes.icon24

export const extraMarginForHoverAnimation = isHoverable ? Math.ceil(logoSize * (WEB_HOVER_SCALE - 1)) : 0
