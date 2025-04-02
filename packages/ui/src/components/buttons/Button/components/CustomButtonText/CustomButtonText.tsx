import { Text, styled } from 'tamagui'
import { variantEmphasisHash } from 'ui/src/components/buttons/Button/components/CustomButtonText/variantEmphasisHash'
import { buttonStyledContext, lineHeights } from 'ui/src/components/buttons/Button/constants'
import type { ButtonEmphasis, ButtonVariantProps } from 'ui/src/components/buttons/Button/types'
import { getMaybeHexOrRGBColor } from 'ui/src/components/buttons/Button/utils/getMaybeHexOrRGBColor'
import { getContrastPassingTextColor } from 'ui/src/utils/colors'

/**
 * This component is used to render the text/label within our `Button` component.
 * @props color - The color of the text. If passed as HEX or RGBA, the text will use that color for all of its HTML Element states (i.e. hover, active, etc.), overriding the `emphasis` and `variant` prop.
 * @props custom-background-color - The background color of the `Button` this `CustomButtonText` is a child of. If passed, the text will use the contrast color of the background color for its hover state.
 * **NOTE:** this doesn't need to be passed explicitly if `CustomButtonText`, or `Button.Text`, is a child of a `Button` component has a `backgroundColor` prop passed to it..
 */
export const CustomButtonText = styled(Text, {
  context: buttonStyledContext,
  tag: 'span',
  fontFamily: '$button',
  color: '$color',
  cursor: 'pointer',
  maxFontSizeMultiplier: 1.2,
  numberOfLines: 1,
  variants: {
    variant: {
      // @ts-expect-error we know variant will be ButtonVariant
      ':string': (variant: Required<ButtonVariantProps>['variant'], { props }) => {
        // TODO(WEB-6347): change name back to `disabled`
        // @ts-expect-error we know isDisabled will be ButtonVariantProps['isDisabled']
        if (props.isDisabled) {
          return {
            color: '$neutral2',
          }
        }

        // @ts-expect-error we know 'custom-background-color' might be on `props` via `buttonStyledContext`, and if it is, it's a GetThemeValueForKey<'backgroundColor'> | OpaqueColorValue
        const customBackgroundColor = props['custom-background-color']
        const maybeCustomColorProp = getMaybeHexOrRGBColor(props.color)

        const maybeButtonBackgroundCustomColor = getMaybeHexOrRGBColor(customBackgroundColor)

        if (maybeButtonBackgroundCustomColor) {
          return {
            color: getContrastPassingTextColor(maybeButtonBackgroundCustomColor),
          }
        }

        if (maybeCustomColorProp) {
          return {
            color: maybeCustomColorProp,
            '$group-item-hover': {
              color: maybeCustomColorProp,
            },
          }
        }

        const emphasis =
          // @ts-expect-error we know emphasis will be ButtonEmphasis
          (props.emphasis || 'primary') as NonNullable<ButtonEmphasis>

        return variantEmphasisHash[variant][emphasis]
      },
    },
    // these are taken from Figma and mapped to the values in fonts.ts > buttonFont
    // https://github.com/Uniswap/universe/blob/main/packages/ui/src/theme/fonts.ts
    size: {
      xxsmall: {
        fontSize: '$micro',
        fontWeight: '$medium',
        lineHeight: lineHeights.xxsmall,
      },
      xsmall: {
        fontSize: '$micro',
        fontWeight: '$medium',
        lineHeight: lineHeights.xsmall,
      },
      small: {
        fontSize: '$small',
        fontWeight: '$medium',
        lineHeight: lineHeights.small,
      },
      medium: {
        fontSize: '$medium',
        fontWeight: '$medium',
        lineHeight: lineHeights.medium,
      },
      large: {
        fontSize: '$large',
        fontWeight: '$medium',
        lineHeight: lineHeights.large,
      },
    },
  } as const,
})
