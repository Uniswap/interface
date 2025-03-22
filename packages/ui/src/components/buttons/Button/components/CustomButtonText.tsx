import { Text, styled } from 'tamagui'
import { buttonStyledContext, lineHeights } from 'ui/src/components/buttons/Button/constants'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'

export const CustomButtonText = styled(Text, {
  context: buttonStyledContext,
  tag: 'span',
  fontFamily: '$button',
  color: '$color',
  cursor: 'pointer',
  maxFontSizeMultiplier: 1.2,
  variants: {
    variant: {
      // @ts-expect-error we know variant will be ButtonVariant
      ':string': (variant: Required<ButtonVariantProps>['variant'], { props }) => {
        if (props.disabled) {
          return {
            color: '$neutral2',
          }
        }

        const emphasis =
          // @ts-expect-error we know emphasis will be ButtonEmphasis
          (props.emphasis || 'primary') as ButtonEmphasis

        if (variant === 'branded') {
          if (emphasis === 'tertiary') {
            return {
              color: '$accent1',
            }
          }

          if (emphasis === 'secondary') {
            return {
              color: '$accent1',
            }
          }

          return {
            color: '$white',
          }
        }

        if (variant === 'critical') {
          if (emphasis === 'tertiary') {
            return {
              color: '$statusCritical',
            }
          }

          if (emphasis === 'secondary') {
            return {
              color: '$statusCritical',
            }
          }

          return {
            color: '$white',
          }
        }

        if (emphasis === 'tertiary') {
          return {
            color: '$neutral1',
          }
        }

        if (emphasis === 'secondary') {
          return {
            color: '$neutral1',
          }
        }

        return {
          color: '$surface1',
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
    singleLine: {
      true: {
        numberOfLines: 1,
      },
    },
  } as const,
})
