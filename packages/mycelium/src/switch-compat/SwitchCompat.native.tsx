/**
 * Native leg of the Switch compat (INFRA-3644) — the former `ui/src` Switch's
 * native leg, re-homed: RNGH Pressable + reanimated track/thumb/icon, colors
 * from the theme-hooks compat; the check is mycelium's `Check` icon.
 */
import { type JSX, memo, useEffect, useMemo } from 'react'
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
// RNGH Pressable (not RN's) so the switch's tap gesture coordinates with the RNGH-backed TouchableArea it nests inside.
import { Pressable } from 'react-native-gesture-handler'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useEvent } from 'utilities/src/react/hooks'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { Check } from '../components/icons/Check'
import { useSporeColors } from '../theme-hooks-compat/useSporeColors'
import {
  SWITCH_CHECK_ICON_SIZE,
  SWITCH_CHECK_STROKE_WIDTH,
  SWITCH_THUMB_HEIGHT,
  SWITCH_THUMB_PADDING,
  SWITCH_TRACK_HEIGHT,
  SWITCH_TRACK_WIDTH,
  type SwitchCompatProps,
} from './props'

export type { SwitchCompatProps, SwitchCompatVariant } from './props'

const ANIMATION_CONFIG = {
  duration: 80,
  easing: Easing.inOut(Easing.quad),
} as const

type CustomSwitchProps = Pick<
  SwitchCompatProps,
  'checked' | 'defaultChecked' | 'onCheckedChange' | 'disabled' | 'variant' | 'testID'
> & { style?: StyleProp<ViewStyle>; pointerEvents?: Extract<SwitchCompatProps['pointerEvents'], 'none'> }

export const SwitchCompat = memo(function SwitchCompat({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  // oxlint-disable-next-line typescript/no-useless-default-assignment -- defensive default
  variant = 'default',
  style,
  testID,
  pointerEvents,
}: CustomSwitchProps): JSX.Element {
  const colors = useSporeColors()
  const isBranded = variant === 'branded'
  const progress = useSharedValue((checked ?? defaultChecked) ? 1 : 0)

  useEffect(() => {
    if (checked !== undefined && checked !== (progress.value === 1)) {
      progress.value = withTiming(checked ? 1 : 0, ANIMATION_CONFIG)
    }
    // oxlint-disable-next-line react/exhaustive-deps -- transcribed from the legacy leg: only `checked` re-arms the animation
  }, [checked])

  const trackStyle = useAnimatedStyle(() => {
    const isOn = progress.value
    return {
      backgroundColor: withTiming(getTrackColor({ isOn, disabled, isBranded, colors }), ANIMATION_CONFIG),
      opacity: disabled && isOn ? 0.6 : 1,
    }
  })

  const thumbStyle = useAnimatedStyle(() => {
    const isOn = progress.value
    return {
      transform: [
        {
          translateX: withTiming(
            interpolate(isOn, [0, 1], [0, SWITCH_TRACK_WIDTH - SWITCH_THUMB_HEIGHT - SWITCH_THUMB_PADDING * 2]),
            ANIMATION_CONFIG,
          ),
        },
      ],
      backgroundColor: withTiming(getThumbColor({ isOn, disabled, colors }), ANIMATION_CONFIG),
    }
  })

  const iconStyle = useAnimatedStyle(() => {
    const isOn = progress.value
    return {
      opacity: withTiming(isOn, ANIMATION_CONFIG),
    }
  })

  const handlePress = useEvent((): void => {
    if (disabled) {
      return
    }
    const newValue = progress.value === 0
    progress.value = withTiming(newValue ? 1 : 0, ANIMATION_CONFIG)
    requestAnimationFrame(() => {
      onCheckedChange?.(newValue)
    })
  })

  const containerStyle: StyleProp<ViewStyle> = useMemo(
    () => (pointerEvents === 'none' ? { pointerEvents: 'none' } : {}),
    [pointerEvents],
  )

  return (
    <Pressable disabled={disabled} hitSlop={12} style={containerStyle} testID={testID} onPress={handlePress}>
      <Animated.View style={[styles.track, style, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <Check
              color={getIconColor({ isOn: progress.value, disabled, isBranded, colors })}
              size={SWITCH_CHECK_ICON_SIZE}
              strokeWidth={SWITCH_CHECK_STROKE_WIDTH}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
})

type SporeColors = ReturnType<typeof useSporeColors>

// Shared worklets for color calculations
function getTrackColor({
  isOn,
  disabled,
  isBranded,
  colors,
}: {
  isOn: number
  disabled: boolean | undefined
  isBranded: boolean
  colors: SporeColors
}): string {
  'worklet'
  if (disabled && !isOn) {
    return colors.surface3.val
  }
  if (isBranded) {
    return isOn ? colors.accent1.val : colors.neutral3.val
  }
  return isOn ? colors.neutral1.val : colors.neutral3.val
}

function getThumbColor({
  isOn,
  disabled,
  colors,
}: {
  isOn: number
  disabled: boolean | undefined
  colors: SporeColors
}): string {
  'worklet'
  if (disabled && !isOn) {
    return colors.neutral3.val
  }
  return colors.white.val
}

function getIconColor({
  isOn,
  disabled,
  isBranded,
  colors,
}: {
  isOn: number
  disabled: boolean | undefined
  isBranded: boolean
  colors: SporeColors
}): string {
  'worklet'
  if (disabled && !isOn) {
    return colors.white.val
  }
  return isBranded ? colors.accent1.val : colors.neutral1.val
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  thumb: {
    alignItems: 'center',
    borderRadius: SWITCH_THUMB_HEIGHT / 2,
    height: SWITCH_THUMB_HEIGHT,
    justifyContent: 'center',
    width: SWITCH_THUMB_HEIGHT,
  },
  track: {
    alignItems: 'flex-start',
    borderRadius: SWITCH_TRACK_HEIGHT / 2,
    height: SWITCH_TRACK_HEIGHT,
    padding: SWITCH_THUMB_PADDING,
    width: SWITCH_TRACK_WIDTH,
  },
})

// Legacy color-injecting wrappers (TouchableArea compat) must skip this
// primitive — it styles itself and rejects legacy token guidance.
markMyceliumPrimitive(SwitchCompat)
