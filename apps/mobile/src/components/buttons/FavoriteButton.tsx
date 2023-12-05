import React from 'react'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { AnimatedFlex, useSporeColors } from 'ui/src'
import HeartIcon from 'ui/src/assets/icons/heart.svg'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

interface FavoriteButtonProps {
  isFavorited: boolean
  size: number
  onPress: () => void
}

export const FavoriteButton = ({
  isFavorited,
  size,
  onPress,
}: FavoriteButtonProps): JSX.Element => {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const unfilledColor = isDarkMode ? colors.neutral3.val : colors.surface3.val
  const color = isFavorited ? colors.accent1.val : unfilledColor

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])
  const animationConfig = { duration: 150 }

  const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      cancelAnimation(scale)
      scale.value = withTiming(0, animationConfig)
    },
    onFinish: () => {
      runOnJS(onPress)()
      scale.value = withTiming(1, animationConfig)
    },
  })

  return (
    <TapGestureHandler onGestureEvent={onGestureEvent}>
      <AnimatedFlex style={animatedStyle}>
        <HeartIcon color={color} height={size} width={size} />
      </AnimatedFlex>
    </TapGestureHandler>
  )
}
