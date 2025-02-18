import { XStack, XStackProps, styled } from 'tamagui'
import { buttonStyledContext } from 'ui/src/components/buttons/Button/constants'
import { ButtonVariantProps } from 'ui/src/components/buttons/Button/types'

import { isWeb } from 'utilities/src/platform'

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

export const CustomButtonFrame = styled(XStack, {
  context: buttonStyledContext,
  name: 'Button',
  tag: 'button',
  // TODO: remove this once we've updated to tamagui@~1.120.2
  // CAUTION: When animation is passed on Web, it loses the ability to be focused. Adding an animation on Web will also cause the button to regain its default styling at the end of a `click` event.
  ...(isWeb ? {} : { animation: 'fast' }),
  // instead of setting border: 0 when no border, make it 1px but transparent, so the size or alignment of a button won't change unexpectedly between variants
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$background',
  borderColor: '$borderColor',
  focusVisibleStyle: {
    outlineWidth: 1,
    outlineOffset: 2,
    outlineStyle: 'solid',
  },
  pressStyle: {
    scale: PRESS_SCALE,
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

        if (props.disabled) {
          return {
            backgroundColor: '$surface2',
          }
        }

        /* Branded Styling */
        if (variant === 'branded') {
          /* Branded Styling - Tertiary Emphasis */
          if (emphasis === 'tertiary') {
            return {
              borderColor: '$accent2',
              borderWidth: 1,

              hoverStyle: {
                borderColor: '$accent2Hovered',
              },

              focusVisibleStyle: {
                backgroundColor: '$surface1',
                ...brandedFocusVisibleStyle,
              },

              pressStyle: {
                borderColor: '$accent2Hovered',
              },
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
              pressStyle: {
                backgroundColor: '$accent2Hovered',
              },
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
            pressStyle: {
              backgroundColor: '$accent1Hovered',
            },
          }
        }

        /* Critical Styling */
        if (variant === 'critical') {
          /* Critical Styling - Tertiary Emphasis */
          if (emphasis === 'tertiary') {
            return {
              backgroundColor: 'transparent',
              borderColor: '$statusCritical2',
              borderWidth: 1,
              hoverStyle: {
                borderColor: '$statusCritical2Hovered',
              },
              focusVisibleStyle: {
                backgroundColor: '$surface1',
                ...criticalFocusVisibleStyle,
              },
              pressStyle: {
                borderColor: '$statusCritical2Hovered',
              },
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

              pressStyle: {
                backgroundColor: '$statusCritical2Hovered',
              },
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
            pressStyle: {
              backgroundColor: '$statusCriticalHovered',
            },
          }
        }

        /* Default Styling */

        /* Default Styling - Tertiary Emphasis */
        if (emphasis === 'tertiary') {
          return {
            backgroundColor: 'transparent',
            borderColor: '$surface3',
            borderWidth: 1,
            hoverStyle: {
              borderColor: '$surface3Hovered',
            },
            focusVisibleStyle: {
              backgroundColor: '$surface1',
              ...defaultFocusVisibleStyle,
            },
            pressStyle: {
              borderColor: '$surface3Hovered',
            },
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
            pressStyle: {
              backgroundColor: '$surface3Hovered',
            },
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
          pressStyle: {
            backgroundColor: '$accent3Hovered',
          },
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
        py: '$spacing8',
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
        py: '$spacing12',
        borderRadius: '$rounded12',
        gap: '$spacing8',
      },
      medium: {
        px: '$spacing16',
        py: '$spacing16',
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
      },
    },
    disabled: {
      true: {
        pointerEvents: 'none',
        userSelect: 'none',
      },
    },
  } as const,
})
