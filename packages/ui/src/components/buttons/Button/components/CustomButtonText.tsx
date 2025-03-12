import { OpaqueColorValue } from 'react-native'
import { GetProps, GetThemeValueForKey, Text, styled } from 'tamagui'
import { buttonStyledContext, lineHeights } from 'ui/src/components/buttons/Button/constants'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'
import { getMaybeHexOrRGBColor } from 'ui/src/components/buttons/Button/utils/getMaybeHexOrRGBColor'
import { getContrastPassingTextColor } from 'ui/src/utils/colors'

const CustomButtonTextWithoutCustomProps = styled(Text, {
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

        // @ts-expect-error we know customBackgroundColor will be GetThemeValueForKey<'backgroundColor'> | OpaqueColorValue
        // it's typed via the typecast exported in this file, and so will be available wherever this component is used
        // We don't want to use `backgroundColor` here as it will actually set the background color of the text
        const maybeButtonBackgroundCustomColor = getMaybeHexOrRGBColor(props.customBackgroundColor)

        if (maybeButtonBackgroundCustomColor) {
          return {
            color: getContrastPassingTextColor(maybeButtonBackgroundCustomColor),
          }
        }

        const emphasis =
          // @ts-expect-error we know emphasis will be ButtonEmphasis
          (props.emphasis || 'primary') as ButtonEmphasis

        if (variant === 'branded') {
          if (emphasis === 'secondary' || emphasis === 'tertiary' || emphasis === 'text-only') {
            return {
              color: '$accent1',
              '$group-item-hover': {
                color: '$accent1Hovered',
              },
            }
          }

          return {
            color: '$white',
          }
        }

        if (variant === 'critical') {
          if (emphasis === 'secondary' || emphasis === 'tertiary' || emphasis === 'text-only') {
            return {
              color: '$statusCritical',
              '$group-item-hover': {
                color: '$statusCriticalHovered',
              },
            }
          }

          return {
            color: '$white',
          }
        }

        if (emphasis === 'secondary' || emphasis === 'tertiary' || emphasis === 'text-only') {
          return {
            color: '$neutral1',
            '$group-item-hover': {
              color: '$neutral1Hovered',
            },
          }
        }

        return {
          color: '$surface1',
          '$group-item-hover': {
            color: '$surface1Hovered',
          },
        }
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

type CustomProps = {
  customBackgroundColor?: GetThemeValueForKey<'backgroundColor'> | OpaqueColorValue
}

type CustomButtonTextWithExtraProps = typeof CustomButtonTextWithoutCustomProps & {
  (props: CustomProps & GetProps<typeof CustomButtonTextWithoutCustomProps>): JSX.Element | null
}

export const CustomButtonText = CustomButtonTextWithoutCustomProps as CustomButtonTextWithExtraProps
