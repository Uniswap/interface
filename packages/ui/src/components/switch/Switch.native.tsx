import { memo, useEffect } from 'react'
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Check } from 'ui/src/components/icons'
import {
  SWITCH_THUMB_HEIGHT,
  SWITCH_THUMB_PADDING,
  SWITCH_TRACK_HEIGHT,
  SWITCH_TRACK_WIDTH,
} from 'ui/src/components/switch/shared'
import { SwitchProps } from 'ui/src/components/switch/types'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

const ANIMATION_CONFIG = {
  duration: 80,
  easing: Easing.inOut(Easing.quad),
} as const

export const Switch = memo(function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  variant = 'default',
  style,
  testID,
  pointerEvents,
}: Omit<SwitchProps, 'style'> & { style?: StyleProp<ViewStyle> }): JSX.Element {
  const colors = useSporeColors()
  const isBranded = variant === 'branded'
  const progress = useSharedValue(checked ?? defaultChecked ? 1 : 0)

  useEffect(() => {
    if (checked !== undefined && checked !== (progress.value === 1)) {
      progress.value = withTiming(checked ? 1 : 0, ANIMATION_CONFIG)
    }
  }, [checked, progress])

  const trackStyle = useAnimatedStyle(() => {
    const isOn = progress.value
    return {
      backgroundColor: withTiming(getTrackColor(isOn, disabled, isBranded, colors), ANIMATION_CONFIG),
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
      backgroundColor: withTiming(getThumbColor(isOn, disabled, isBranded, colors), ANIMATION_CONFIG),
    }
  })

  const iconStyle = useAnimatedStyle(() => {
    const isOn = progress.value
    return {
      opacity: withTiming(isOn, ANIMATION_CONFIG),
    }
  })

  const handlePress = (): void => {
    if (disabled) {
      return
    }
    const newValue = progress.value === 0
    progress.value = withTiming(newValue ? 1 : 0, ANIMATION_CONFIG)
    requestAnimationFrame(() => {
      onCheckedChange?.(newValue)
    })
  }

  return (
    <Pressable
      disabled={disabled}
      hitSlop={12}
      style={[styles.container, pointerEvents === 'none' ? { pointerEvents: 'none' } : {}]}
      testID={testID}
      onPress={handlePress}
    >
      <Animated.View style={[styles.track, style, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <Check size={14} color={getIconColor(progress.value, disabled, isBranded, colors)} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
})

// Shared worklets for color calculations
function getTrackColor(
  isOn: number,
  disabled: boolean | undefined,
  isBranded: boolean,
  colors: ReturnType<typeof useSporeColors>,
): string {
  'worklet'
  if (disabled && !isOn) {
    return colors.surface3.val
  }
  if (isBranded) {
    return isOn ? colors.accent1.val : colors.neutral3.val
  }
  return isOn ? colors.accent3.val : colors.neutral3.val
}

function getThumbColor(
  isOn: number,
  disabled: boolean | undefined,
  isBranded: boolean,
  colors: ReturnType<typeof useSporeColors>,
): string {
  'worklet'
  if (disabled && !isOn) {
    return isBranded ? colors.neutral2.val : colors.neutral3.val
  }
  if (isBranded) {
    return isOn ? colors.white.val : colors.neutral1.val
  }
  return isOn ? colors.surface1.val : colors.neutral1.val
}

function getIconColor(
  isOn: number,
  disabled: boolean | undefined,
  isBranded: boolean,
  colors: ReturnType<typeof useSporeColors>,
): string {
  'worklet'
  if (disabled && !isOn) {
    return colors.white.val
  }
  return isBranded ? colors.accent1.val : colors.neutral1.val
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    minHeight: SWITCH_TRACK_HEIGHT + SWITCH_THUMB_PADDING * 2,
    minWidth: SWITCH_TRACK_WIDTH + SWITCH_THUMB_PADDING * 2,
  },
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
