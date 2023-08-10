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
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex } from 'src/components/layout'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import HeartIcon from 'ui/src/assets/icons/heart.svg'

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
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()
  const unfilledColor = isDarkMode ? theme.colors.neutral3 : theme.colors.surface3
  const color = isFavorited ? theme.colors.accent1 : unfilledColor

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
