import { GetProps, XStack, XStackProps, styled } from 'tamagui'
import { buttonStyledContext } from 'ui/src/components/buttons/Button/constants'
import { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'
import { getMaybeHexOrRGBColor } from 'ui/src/components/buttons/Button/utils/getMaybeHexOrRGBColor'

import { getHoverCssFilter } from 'ui/src/utils/colors'

const FOCUS_SCALE = 0.98
const PRESS_SCALE = FOCUS_SCALE

const defaultFocusVisibleStyle = {
  outlineColor: '$neutral3Hovered',
} satisfies XStackProps['focusVisibleStyle']

const brandedFocusVisibleStyle = {
  outlineColor: '$accent1Hovered',
} satisfies XStackProps['focusVisibleStyle']

const criticalFocusVisibleStyle = {
  outlineColor: '$statusCriticalHovered',
} satisfies XStackProps['focusVisibleStyle']

const COMMON_PRESS_STYLE = {
  scale: PRESS_SCALE,
} satisfies XStackProps['pressStyle']

// We have this because, if `COMMON_PRESS_STYLE` is applied in the top=level of `styled`'s options, it gets overridden by any additional `pressStyle` passed in via a subsequent variant
const withCommonPressStyle = (style: XStackProps['pressStyle']): XStackProps['pressStyle'] => ({
  ...COMMON_PRESS_STYLE,
  ...style,
})

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
    // adding emphasis as a variant gives `CustomButtonFrame` the the type inference it needs
    emphasis: {
      primary: {},
      secondary: {},
      tertiary: {},
      'text-only': {},
    },
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
        const variant = untypedVariant as ButtonVariantProps['variant']

        const emphasis =
          // @ts-expect-error we know emphasis will be ButtonEmphasis
          (props.emphasis || 'primary') as ButtonVariantProps['emphasis']

        // TODO(WEB-6347): change name back to `disabled`
        // @ts-expect-error we know isDisabled will be ButtonVariantProps['isDisabled']
        if (props.isDisabled) {
          return {
            backgroundColor: '$surface2',
          }
        }

        const hexOrRGBColorFromProps = getMaybeHexOrRGBColor(props.backgroundColor)
        // @ts-expect-error we know primary-color will be a string
        // We're unable to directly inject the props of a component created using `styled`, so we've typecasted it below, resulting in `primary-color` being an accepted prop when using `CustomButtonFrame` directly
        const maybePrimaryColor = getMaybeHexOrRGBColor(props['primary-color'])

        // When a `backgroundColor` is passed in as a prop, we automatically use it to set the other states
        // In the `Button` implementation, this is passed as the prop, `customBackgroundColor`, to `CustomButtonText`
        if (hexOrRGBColorFromProps) {
          const DARK_FILTER = getHoverCssFilter({ isDarkMode: true, differenceFrom1: 0.25 })
          const LIGHT_FILTER = getHoverCssFilter({ isDarkMode: true, differenceFrom1: 0.25 })

          return {
            borderColor: hexOrRGBColorFromProps,
            pressStyle: withCommonPressStyle({
              filter: DARK_FILTER,
            }),
            '$theme-dark': {
              focusVisibleStyle: {
                filter: DARK_FILTER,
                outlineColor: maybePrimaryColor ?? hexOrRGBColorFromProps,
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
                outlineColor: maybePrimaryColor ?? hexOrRGBColorFromProps,
              },
              pressStyle: withCommonPressStyle({
                filter: LIGHT_FILTER,
              }),
              hoverStyle: {
                borderColor: maybePrimaryColor ?? hexOrRGBColorFromProps,
                filter: LIGHT_FILTER,
              },
            },
          }
        }

        /* Branded Styling */
        if (variant === 'branded') {
          /* Branded Styling - Tertiary Emphasis */
          if (emphasis === 'tertiary') {
            return {
              borderColor: '$accent2',
              hoverStyle: {
                borderColor: '$accent2Hovered',
              },
              focusVisibleStyle: {
                backgroundColor: '$surface1',
                ...brandedFocusVisibleStyle,
              },
              pressStyle: withCommonPressStyle({
                borderColor: '$accent2Hovered',
              }),
            }
          }

          /* Branded Styling - Secondary Emphasis */
          if (emphasis === 'secondary') {
            return {
              backgroundColor: '$accent2',
              hoverStyle: {
                backgroundColor: '$accent2Hovered',
              },
              focusVisibleStyle: {
                backgroundColor: '$accent2Hovered',
                ...brandedFocusVisibleStyle,
              },
              pressStyle: withCommonPressStyle({
                backgroundColor: '$accent2Hovered',
              }),
            }
          }

          /* Branded Styling - Primary Emphasis */
          return {
            backgroundColor: '$accent1',
            hoverStyle: {
              backgroundColor: '$accent1Hovered',
            },
            focusVisibleStyle: {
              backgroundColor: '$accent1Hovered',
              ...brandedFocusVisibleStyle,
            },
            pressStyle: withCommonPressStyle({
              backgroundColor: '$accent1Hovered',
            }),
          }
        }

        /* Critical Styling */
        if (variant === 'critical') {
          /* Critical Styling - Tertiary Emphasis */

          if (emphasis === 'tertiary') {
            return {
              borderColor: '$statusCritical2',
              hoverStyle: {
                borderColor: '$statusCritical2Hovered',
              },
              focusVisibleStyle: {
                backgroundColor: '$surface1',
                ...criticalFocusVisibleStyle,
              },
              pressStyle: withCommonPressStyle({
                borderColor: '$statusCritical2Hovered',
              }),
            }
          }

          if (emphasis === 'text-only') {
            return {
              borderColor: '$transparent',
              focusVisibleStyle: criticalFocusVisibleStyle,
              pressStyle: withCommonPressStyle({
                borderColor: '$transparent',
              }),
            }
          }

          /* Critical Styling - Secondary Emphasis */
          if (emphasis === 'secondary') {
            return {
              backgroundColor: '$statusCritical2',
              hoverStyle: {
                backgroundColor: '$statusCritical2Hovered',
              },
              focusVisibleStyle: {
                backgroundColor: '$statusCritical2Hovered',
                ...criticalFocusVisibleStyle,
              },
              pressStyle: withCommonPressStyle({
                backgroundColor: '$statusCritical2Hovered',
              }),
            }
          }

          /* Critical Styling - Primary Emphasis */
          return {
            backgroundColor: '$statusCritical',
            hoverStyle: {
              backgroundColor: '$statusCriticalHovered',
            },
            focusVisibleStyle: {
              backgroundColor: '$statusCriticalHovered',
              ...criticalFocusVisibleStyle,
            },
            pressStyle: withCommonPressStyle({
              backgroundColor: '$statusCriticalHovered',
            }),
          }
        }

        /* Default Styling */

        /* Default Styling - Tertiary Emphasis */
        if (emphasis === 'tertiary') {
          return {
            borderColor: '$surface3',
            hoverStyle: {
              borderColor: '$surface3Hovered',
            },
            focusVisibleStyle: {
              backgroundColor: '$surface1',
              ...defaultFocusVisibleStyle,
            },
            pressStyle: withCommonPressStyle({
              borderColor: '$surface3Hovered',
            }),
          }
        }

        if (emphasis === 'text-only') {
          return {
            borderColor: '$transparent',
            focusVisibleStyle: defaultFocusVisibleStyle,
            pressStyle: withCommonPressStyle({
              borderColor: '$transparent',
            }),
          }
        }

        /* Default Styling - Secondary Emphasis */
        if (emphasis === 'secondary') {
          return {
            backgroundColor: '$surface3',
            hoverStyle: {
              backgroundColor: '$surface3Hovered',
            },
            focusVisibleStyle: {
              backgroundColor: '$surface3Hovered',
              ...defaultFocusVisibleStyle,
            },
            pressStyle: withCommonPressStyle({
              backgroundColor: '$surface3Hovered',
            }),
          }
        }

        /* Default Styling - Primary Emphasis */
        return {
          backgroundColor: '$accent3',
          hoverStyle: {
            backgroundColor: '$accent3Hovered',
          },
          focusVisibleStyle: {
            backgroundColor: '$accent3Hovered',
            ...defaultFocusVisibleStyle,
          },
          pressStyle: withCommonPressStyle({
            backgroundColor: '$accent3Hovered',
          }),
        }
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
        px: '$spacing6',
        py: '$spacing4',
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
    isDisabled: {
      true: {
        pointerEvents: 'none',
        userSelect: 'none',
      },
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

type CustomProps = {
  'primary-color'?: string
}

type CustomButtonWithExtraProps = typeof CustomButtonFrameWithoutCustomProps & {
  (props: CustomProps & GetProps<typeof CustomButtonFrameWithoutCustomProps>): JSX.Element | null
}

export const CustomButtonFrame = CustomButtonFrameWithoutCustomProps as CustomButtonWithExtraProps
