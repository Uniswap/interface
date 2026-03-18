import { styled, YStack, type YStackProps } from 'tamagui'
import { FOCUS_SCALE } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/constants'
import { withCommonPressStyle } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/utils'
import { isWebPlatform } from 'utilities/src/platform'

type TouchableAreaVariant = 'unstyled' | 'none' | 'outlined' | 'filled' | 'raised' | 'floating'

// This comes from the `hoverable` variant of the `TouchableAreaFrame`
// But it can't circularly reference itself, so we need to define it here
type PropsWithHoverableAndDisabled = {
  props: {
    hoverable?: boolean
    disabled?: boolean
  }
}

export const TouchableAreaFrame = styled(YStack, {
  name: 'TouchableArea',
  tag: 'div',
  role: 'button',
  group: true,
  pressStyle: withCommonPressStyle({}),
  borderRadius: '$rounded12',
  backgroundColor: '$transparent',
  '$platform-web': {
    containerType: 'normal',
  },
  focusVisibleStyle: {
    scaleX: FOCUS_SCALE,
    scaleY: FOCUS_SCALE,
    outlineWidth: 1,
    outlineOffset: 1,
    outlineStyle: 'solid',
  },
  cursor: 'pointer',
  variants: {
    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    row: {
      true: {
        flexDirection: 'row',
      },
      false: {
        flexDirection: 'column',
      },
    },
    disabled: {
      true: {
        'aria-disabled': true,
        userSelect: 'none',
        opacity: 0.6,
        pointerEvents: 'box-none',
        tabIndex: -1,
        cursor: 'default',
        '$platform-web': {
          pointerEvents: 'none',
        },
      },
      false: {
        '$platform-web': {
          // Explicitly setting this enables a child to be clickable even when the parent is disabled
          pointerEvents: 'auto',
        },
      },
    },
    hoverable: {
      // when true, `hoverStyle` is applied via the variant
      true: {},
      // when false, `hoverStyle` is disabled
      false: {
        hoverStyle: undefined,
      },
    },
    variant: {
      unstyled: {
        pressStyle: {
          scale: 1,
        },
        focusVisibleStyle: {
          outlineColor: '$neutral3',
        },
      },
      none: (_: unknown, { props: { hoverable } }: PropsWithHoverableAndDisabled): Partial<YStackProps> => ({
        hoverStyle: hoverable
          ? {
              backgroundColor: '$surface2Hovered',
            }
          : undefined,
        focusVisibleStyle: {
          backgroundColor: '$surface2Hovered',
          outlineColor: '$neutral3',
        },
      }),
      outlined: (_: unknown, { props: { hoverable } }: PropsWithHoverableAndDisabled): Partial<YStackProps> => ({
        borderWidth: 1,
        borderColor: '$surface3',
        hoverStyle: hoverable
          ? {
              borderColor: '$surface3Hovered',
              backgroundColor: '$surface2Hovered',
            }
          : undefined,
        focusVisibleStyle: {
          borderColor: '$surface3Hovered',
          backgroundColor: '$surface2Hovered',
          outlineColor: '$neutral3',
        },
      }),
      filled: (_: unknown, { props: { hoverable } }: PropsWithHoverableAndDisabled): Partial<YStackProps> => ({
        backgroundColor: '$surface3',
        hoverStyle: hoverable
          ? {
              borderColor: '$surface3Hovered',
              backgroundColor: '$surface3Hovered',
            }
          : undefined,
        focusVisibleStyle: {
          borderColor: '$surface3Hovered',
          backgroundColor: '$surface3Hovered',
          outlineColor: '$neutral3',
        },
      }),
      raised: (_: unknown, { props: { hoverable, disabled } }: PropsWithHoverableAndDisabled): Partial<YStackProps> => {
        return {
          // We can't nest `$theme-[dark/light]` within `$platform-web` because Tamagui doesn't support it
          '$theme-dark': {
            boxShadow: disabled
              ? undefined
              : isWebPlatform
                ? `0px 1px 6px 2px rgba(0, 0, 0, 0.54), 0px 1px 2px 0px rgba(0, 0, 0, 0.40)`
                : undefined,
            shadowColor: disabled ? undefined : isWebPlatform ? 'rgba(0, 0, 0, 0.40)' : undefined,
          },
          '$theme-light': {
            boxShadow: disabled
              ? undefined
              : isWebPlatform
                ? `0px 1px 6px 2px rgba(0, 0, 0, 0.03), 0px 1px 2px 0px rgba(0, 0, 0, 0.02)`
                : undefined,
            shadowColor: disabled ? undefined : isWebPlatform ? 'rgba(0, 0, 0, 0.02)' : undefined,
          },
          '$platform-native': disabled
            ? {}
            : {
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                shadowColor: '$black',
              },
          '$platform-android': disabled
            ? {}
            : {
                elevation: 1,
              },
          borderWidth: 1,
          borderColor: '$surface3',
          hoverStyle: hoverable
            ? {
                borderColor: '$surface3Hovered',
              }
            : undefined,
          focusVisibleStyle: {
            borderColor: '$surface3Hovered',
            outlineColor: '$neutral3',
          },
          backgroundColor: disabled ? '$surface2' : undefined,
        }
      },
      floating: (_: unknown, { props: { hoverable } }: PropsWithHoverableAndDisabled): Partial<YStackProps> => ({
        backgroundColor: '$surface5',
        '$platform-web': {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)', // for Safari
        },
        hoverStyle: hoverable
          ? {
              backgroundColor: '$surface5Hovered',
            }
          : undefined,
        focusVisibleStyle: {
          backgroundColor: '$surface5Hovered',
          outlineColor: '$neutral3',
        },
      }),
    } as Record<NonNullable<TouchableAreaVariant>, Partial<YStackProps>>,
  } as const,
  defaultVariants: {
    variant: 'none',
    centered: false,
    hoverable: true,
    row: false,
  },
})

TouchableAreaFrame.displayName = 'TouchableAreaFrame'
