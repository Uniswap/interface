import type { GetProps } from 'tamagui'
import { styled, Text } from 'tamagui'
import { variantEmphasisHash } from 'ui/src/components/buttons/Button/components/CustomButtonText/variantEmphasisHash'
import { buttonStyledContext, lineHeights } from 'ui/src/components/buttons/Button/constants'
import type { ButtonEmphasis, ButtonVariantProps } from 'ui/src/components/buttons/Button/types'
import { getMaybeHexOrRGBColor } from 'ui/src/components/buttons/Button/utils/getMaybeHexOrRGBColor'
import { getContrastPassingTextColor } from 'ui/src/utils/colors'

function createSizeVariant({
  fontSize,
  fontWeight,
  lineHeightValue,
}: {
  fontSize: string
  fontWeight: string
  lineHeightValue: string | number
}) {
  return (
    _size: NonNullable<ButtonVariantProps['size']>,
    context: { props: Record<string, unknown> },
  ): Record<string, unknown> => {
    const baseStyles = {
      fontSize,
      fontWeight,
    }

    const lineHeightDisabled = context.props['line-height-disabled']

    if (lineHeightDisabled === 'true') {
      return baseStyles
    }

    return {
      ...baseStyles,
      lineHeight: lineHeightValue,
    }
  }
}

/**
 * This component is used to render the text/label within our `Button` component.
 * @props color - The color of the text. If passed as HEX or RGBA, the text will use that color for all of its HTML Element states (i.e. hover, active, etc.), overriding the `emphasis` and `variant` prop.
 * @props custom-background-color - The background color of the `Button` this `CustomButtonText` is a child of. If passed, the text will use the contrast color of the background color for its hover state.
 * **NOTE:** this doesn't need to be passed explicitly if `CustomButtonText`, or `Button.Text`, is a child of a `Button` component has a `backgroundColor` prop passed to it..
 */
const CustomButtonTextStyled = styled(Text, {
  context: buttonStyledContext,
  tag: 'span',
  fontFamily: '$button',
  color: '$color',
  maxFontSizeMultiplier: 1.2,
  numberOfLines: 1,
  textAlign: 'center',
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
      xxsmall: createSizeVariant({ fontSize: '$micro', fontWeight: '$medium', lineHeightValue: lineHeights.xxsmall }),
      xsmall: createSizeVariant({ fontSize: '$micro', fontWeight: '$medium', lineHeightValue: lineHeights.xsmall }),
      small: createSizeVariant({ fontSize: '$small', fontWeight: '$medium', lineHeightValue: lineHeights.small }),
      medium: createSizeVariant({ fontSize: '$medium', fontWeight: '$medium', lineHeightValue: lineHeights.medium }),
      large: createSizeVariant({ fontSize: '$large', fontWeight: '$medium', lineHeightValue: lineHeights.large }),
    },
  } as const,
})

type CustomProps = {
  'line-height-disabled'?: string
}

type CustomButtonTextWithExtraProps = typeof CustomButtonTextStyled & {
  (props: CustomProps & GetProps<typeof CustomButtonTextStyled>): JSX.Element | null
}

export const CustomButtonText = CustomButtonTextStyled as CustomButtonTextWithExtraProps

CustomButtonText.displayName = 'CustomButtonText'
