import { ColorTokens, createTokens } from 'tamagui'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colors as color } from 'ui/src/theme/color/colors'
import { fonts } from 'ui/src/theme/fonts'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { imageSizes } from 'ui/src/theme/imageSizes'
import { spacing } from 'ui/src/theme/spacing'
import { themes } from 'ui/src/theme/themes'
import { zIndices } from 'ui/src/theme/zIndices'

const space = { ...spacing, true: spacing.spacing8 }

const size = space

const iconSize = {
  true: iconSizes.icon40,
  8: iconSizes.icon8,
  12: iconSizes.icon12,
  16: iconSizes.icon16,
  20: iconSizes.icon20,
  24: iconSizes.icon24,
  28: iconSizes.icon28,
  36: iconSizes.icon36,
  40: iconSizes.icon40,
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

const zIndex = { ...zIndices, true: zIndices.default }

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

export const validColor = (value: string | undefined | null): ColorTokens => {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof value === 'string') {
      if (value[0] === '$') {
        const valueWithout$Prefix = value.slice(1)
        // check if in color tokens or theme:
        if (!(valueWithout$Prefix in color) && !(valueWithout$Prefix in themes.light)) {
          throw new Error(`Invalid color token: ${value}`)
        }
      } else if (
        value[0] !== '#' &&
        !value.startsWith('rgb(') &&
        !value.startsWith('rgba(') &&
        !value.startsWith('hsl(') &&
        !value.startsWith('hsla(')
      ) {
        throw new Error(
          `Invalid color value: ${value} this helper just does a rough check so if this error is wrong you can update this check!`
        )
      }
    }
  }

  return value as ColorTokens
}
