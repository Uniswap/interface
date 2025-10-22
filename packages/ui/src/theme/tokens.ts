// until the web app needs all of tamagui, avoid heavy imports there
// biome-ignore lint/style/noRestrictedImports: until the web app needs all of tamagui, avoid heavy imports there
import { type ColorTokens, createTokens } from '@tamagui/core'
import type { DynamicColor } from 'ui/src/hooks/useSporeColors'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colors as color } from 'ui/src/theme/color/colors'
import { fonts } from 'ui/src/theme/fonts'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { imageSizes } from 'ui/src/theme/imageSizes'
import { gap, padding, spacing } from 'ui/src/theme/spacing'
import { themes } from 'ui/src/theme/themes'
import { zIndexes } from 'ui/src/theme/zIndexes'

const space = { ...spacing, ...padding, ...gap, true: spacing.spacing8 }

const size = space

const iconSize = {
  true: iconSizes.icon40,
  8: iconSizes.icon8,
  12: iconSizes.icon12,
  16: iconSizes.icon16,
  18: iconSizes.icon18,
  20: iconSizes.icon20,
  24: iconSizes.icon24,
  28: iconSizes.icon28,
  36: iconSizes.icon36,
  40: iconSizes.icon40,
  48: iconSizes.icon48,
  64: iconSizes.icon64,
  70: iconSizes.icon70,
  100: iconSizes.icon100,
}

export type IconSizeTokens = `$icon.${keyof typeof iconSize}`

const imageSize = { ...imageSizes, true: imageSizes.image40 }

const fontSize = {
  heading1: fonts.heading1.fontSize,
  heading2: fonts.heading2.fontSize,
  heading3: fonts.heading3.fontSize,
  subheading1: fonts.subheading1.fontSize,
  subheading2: fonts.subheading2.fontSize,
  body1: fonts.body1.fontSize,
  body2: fonts.body2.fontSize,
  body3: fonts.body3.fontSize,
  buttonLabel1: fonts.buttonLabel1.fontSize,
  buttonLabel2: fonts.buttonLabel2.fontSize,
  buttonLabel3: fonts.buttonLabel3.fontSize,
  buttonLabel4: fonts.buttonLabel4.fontSize,
  monospace: fonts.monospace.fontSize,
  true: fonts.body2.fontSize,
}

const radius = { ...borderRadii, true: borderRadii.none }

const zIndex = { ...zIndexes, true: zIndexes.default }

export const tokens = createTokens({
  color,
  space,
  size,
  font: fontSize,
  icon: iconSize,
  image: imageSize,
  zIndex,
  radius,
})

/**
 * We have enabled allowedStyleValues: 'somewhat-strict-web' on createTamagui
 * which means our Tamagui components only accept valid tokens.
 *
 * But, sometimes we want to accept one-off values that aren't in the design system
 * especially as we migrate over.
 *
 * This is a way we can intentfully whitelist.

 */

// it would be a bit nicer if this was cast to Token
// but we'd need another new Tamagui release to support that (coming soon)

type ColorValue = DynamicColor | string | undefined | null

// Exported for testing
export const getIsTokenFormat = (value: string): boolean => {
  return value[0] === '$'
}

// Exported for testing
export const getIsValidSporeColor = (value: string): boolean => {
  if (getIsTokenFormat(value)) {
    const valueWithout$Prefix = value.slice(1)

    // check if in color tokens or theme:
    if (!(valueWithout$Prefix in color) && !(valueWithout$Prefix in themes.light)) {
      return false
    }

    return true
  }

  return false
}

// Exported for testing
export const validateColorValue = (value: ColorValue): { isValid: boolean; error?: Error } => {
  if (typeof value === 'string') {
    if (getIsTokenFormat(value)) {
      const isValidSporeColor = getIsValidSporeColor(value)

      if (isValidSporeColor) {
        return {
          isValid: true,
          error: undefined,
        }
      }

      return {
        isValid: true,
        error: undefined,
      }
    }

    if (
      value[0] !== '#' &&
      !value.startsWith('rgb(') &&
      !value.startsWith('rgba(') &&
      !value.startsWith('hsl(') &&
      !value.startsWith('hsla(') &&
      !value.startsWith('var(')
    ) {
      return {
        isValid: false,
        error: new Error(
          `Invalid color value: ${value} this helper just does a rough check so if this error is wrong you can update this check!`,
        ),
      }
    }
  }

  return {
    isValid: true,
    error: undefined,
  }
}

export const validColor = (value: ColorValue): ColorTokens | undefined => {
  if (process.env.NODE_ENV !== 'production') {
    const { isValid, error } = validateColorValue(value)

    if (!isValid) {
      throw error
    }
  }

  if (!value) {
    return undefined
  }

  return value as ColorTokens
}

/**
 * Returns the hover color token if it exists, otherwise returns the original color token passed in.
 *
 * @param {ColorValue} nonHoveredColor - The original color token.
 * @returns {ColorTokens} The hover color token if it exists, otherwise the original color token.
 */
export const getMaybeHoverColor = (nonHoveredColor: ColorValue): ColorTokens => {
  if (typeof nonHoveredColor === 'string' && getIsValidSporeColor(nonHoveredColor)) {
    const maybeHoveredColor = `${nonHoveredColor}Hovered`

    const isValidToken = getIsValidSporeColor(maybeHoveredColor)

    if (!isValidToken) {
      return nonHoveredColor as ColorTokens
    }

    return maybeHoveredColor as ColorTokens
  }

  return nonHoveredColor as unknown as ColorTokens
}
