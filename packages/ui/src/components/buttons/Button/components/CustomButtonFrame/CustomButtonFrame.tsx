import { GetProps, styled, XStack } from 'tamagui'
import { FOCUS_SCALE } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/constants'
import { withCommonPressStyle } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/utils'
import { variantEmphasisHash } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/variantEmphasisHash'
import { buttonStyledContext } from 'ui/src/components/buttons/Button/constants'
import type { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'
import { getMaybeHexOrRGBColor } from 'ui/src/components/buttons/Button/utils/getMaybeHexOrRGBColor'
import { getHoverCssFilter } from 'ui/src/utils/colors'

const CustomButtonFrameWithoutCustomProps = styled(XStack, {
  context: buttonStyledContext,
  name: 'Button',
  tag: 'button',
  group: 'item',
  '$platform-web': {
    containerType: 'normal',
  },
  animation: 'fast',
  // TODO(WALL-6057): Ideally we'd like to animate everything; however, there's an issue when animating colors with alpha channels
  animateOnly: ['transform'],
  // instead of setting border: 0 when no border, make it 1px but transparent, so the size or alignment of a button won't change unexpectedly between variants
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$transparent',
  borderColor: '$borderColor',
  focusVisibleStyle: {
    outlineWidth: 1,
    outlineOffset: 2,
    outlineStyle: 'solid',
  },
  cursor: 'pointer',
  height: 'auto',
  // `variants` is a Tamagui term that allows us to define variants for the component
  variants: {
    // By default, the button scales up and down in both directions, slightly more in the Y direction
    // The best strategy will depend on the Button' parent's styling
    // These presets are a good starting point; but, feel free to add more as needed!
    focusScaling: {
      default: {
        focusVisibleStyle: {
          scaleX: FOCUS_SCALE,
          scaleY: FOCUS_SCALE - 0.075,
        },
      },
      equal: {
        focusVisibleStyle: {
          scaleX: FOCUS_SCALE,
          scaleY: FOCUS_SCALE,
        },
      },
      // Scale is proportionate to the button's size
      // On Web, sometimes a smaller button needs to be scaled down more, to account for the `outlineWidth` and `outlineOffset`, so it won't extend beyond the button's bounds in its unfocused state
      // We could try to automatically detect this, but in reality it's based on a few different factors relating to the surrounding elements; so, we'll opt to manually apply this `focusScaling` variant as-needed
      'equal:smaller-button': {
        focusVisibleStyle: {
          scaleX: FOCUS_SCALE - 0.05,
          scaleY: FOCUS_SCALE - 0.05,
        },
      },
      'more-x': {
        focusVisibleStyle: {
          scaleX: FOCUS_SCALE - 0.075,
          scaleY: FOCUS_SCALE,
        },
      },
    },

    // `variant` refers to ButtonVariantProps['variant']
    variant: {
      // See tamagui docs on string, boolean, and number variants
      // https://arc.net/l/quote/lpoqmiea

      ':string': (untypedVariant, { props }) => {
        const variant = (untypedVariant || 'default') as NonNullable<ButtonVariantProps['variant']>

        const emphasis =
          // @ts-expect-error we know emphasis will be ButtonEmphasis
          (props.emphasis || 'primary') as NonNullable<ButtonVariantProps['emphasis']>

        // TODO(WEB-6347): change name back to `disabled`
        // @ts-expect-error we know isDisabled will be ButtonVariantProps['isDisabled']
        if (props.isDisabled && !props.onDisabledPress) {
          return {
            backgroundColor: '$surface2',
          }
        }

        // @ts-expect-error we know this will potentially be on `props`
        if (props.onDisabledPress) {
          return {
            backgroundColor: '$surface2',
            pressStyle: withCommonPressStyle({}),
          }
        }

        const maybeHexOrRGBColorFromProps = getMaybeHexOrRGBColor(props.backgroundColor)
        // @ts-expect-error we know primary-color will be a string
        // We're unable to directly inject the props of a component created using `styled`, so we've typecasted it below, resulting in `primary-color` being an accepted prop when using `CustomButtonFrame` directly
        const maybePrimaryColor = getMaybeHexOrRGBColor(props['primary-color'])

        // When a `backgroundColor` is passed in as a prop, we automatically use it to set the other states
        // This is also passed via `buttonStyledContext` and is available on `props` to components created using `styled` that also use `buttonStyledContext`, for example `CustomButtonText`
        if (maybeHexOrRGBColorFromProps) {
          const DARK_FILTER = getHoverCssFilter({ isDarkMode: true, differenceFrom1: 0.25 })
          const LIGHT_FILTER = getHoverCssFilter({ isDarkMode: true, differenceFrom1: 0.25 })

          return {
            borderColor: maybeHexOrRGBColorFromProps,
            pressStyle: withCommonPressStyle({
              filter: DARK_FILTER,
            }),
            '$theme-dark': {
              focusVisibleStyle: {
                filter: DARK_FILTER,
                outlineColor: maybePrimaryColor ?? maybeHexOrRGBColorFromProps,
              },
              hoverStyle: {
                filter: DARK_FILTER,
                borderColor: maybePrimaryColor,
              },
              pressStyle: withCommonPressStyle({
                filter: DARK_FILTER,
              }),
            },
            '$theme-light': {
              focusVisibleStyle: {
                filter: LIGHT_FILTER,
                outlineColor: maybePrimaryColor ?? maybeHexOrRGBColorFromProps,
              },
              pressStyle: withCommonPressStyle({
                filter: LIGHT_FILTER,
              }),
              hoverStyle: {
                borderColor: maybePrimaryColor ?? maybeHexOrRGBColorFromProps,
                filter: LIGHT_FILTER,
              },
            },
          }
        }

        return variantEmphasisHash[variant][emphasis]
      },
    },
    iconPosition: {
      before: {
        flexDirection: 'row',
      },
      after: {
        flexDirection: 'row-reverse',
      },
    },
    size: {
      xxsmall: {
        p: '$spacing6',
        borderRadius: '$rounded12',
        gap: '$spacing4',
      },
      xsmall: {
        px: '$spacing12',
        py: '$spacing8',
        borderRadius: '$rounded12',
        gap: '$spacing4',
      },
      small: {
        px: '$spacing12',
        py: '$spacing8',
        borderRadius: '$rounded12',
        gap: '$spacing8',
      },
      medium: {
        px: '$spacing16',
        py: '$spacing12',
        borderRadius: '$rounded16',
        gap: '$spacing8',
      },
      large: {
        px: '$spacing20',
        py: '$spacing16',
        borderRadius: '$rounded20',
        gap: '$spacing12',
      },
    },
    fill: {
      true: {
        alignSelf: 'stretch',
        flex: 1,
        flexBasis: 0,
      },
    },
    // TODO(WEB-6347): change variant name back to `disabled`
    isDisabled: (untypedIsDisabled, { props }) => {
      // @ts-expect-error we know this will potentially be on `props`
      if (props.onDisabledPress) {
        // `onDisabledPress` takes priority over `isDisabled` here; we still want to show the button as being interactive on hover, click, focus, etc.
        return {}
      }

      if (untypedIsDisabled) {
        return {
          pointerEvents: 'box-none',
          'aria-disabled': true,
          userSelect: 'none',
          tabIndex: -1,
          cursor: 'default',
          '$platform-web': {
            pointerEvents: 'none',
          },
        }
      }

      return {}
    },
    emphasis: {
      primary: {},
      secondary: {},
      tertiary: {},
      'text-only': {},
    },
  } as const,
  defaultVariants: {
    variant: 'default',
    emphasis: 'primary',
    focusScaling: 'default',
    fill: true,
    size: 'medium',
  },
})

CustomButtonFrameWithoutCustomProps.displayName = 'CustomButtonFrameWithoutCustomProps'

type CustomProps = {
  'primary-color'?: string
  onDisabledPress?: () => void
}

type CustomButtonWithExtraProps = typeof CustomButtonFrameWithoutCustomProps & {
  (props: CustomProps & GetProps<typeof CustomButtonFrameWithoutCustomProps>): JSX.Element | null
}

export const CustomButtonFrame = CustomButtonFrameWithoutCustomProps as CustomButtonWithExtraProps
