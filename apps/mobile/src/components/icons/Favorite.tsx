import React, { useCallback, useEffect, useState } from 'react'
import {
  useAnimatedStyle,
  useDerivedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex } from 'src/components/layout'
import HeartIcon from 'ui/src/assets/icons/heart.svg'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

interface FavoriteButtonProps {
  isFavorited: boolean
  size: number
}

const DELAY = 100
const ANIMATION_CONFIG = { duration: DELAY }

export const Favorite = ({ isFavorited, size }: FavoriteButtonProps): JSX.Element => {
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()
  const unfilledColor = isDarkMode ? theme.colors.neutral2 : theme.colors.surface3

  const getColor = useCallback(
    () => (isFavorited ? theme.colors.accent1 : unfilledColor),
    [isFavorited, theme.colors.accent1, unfilledColor]
  )

  const [color, setColor] = useState(getColor())

  useEffect(() => {
    const timer = setTimeout(() => {
      setColor(getColor())
    }, DELAY)
    return () => clearTimeout(timer)
  }, [getColor, isFavorited])

  const scale = useDerivedValue(() => {
    return withSequence(withTiming(0, ANIMATION_CONFIG), withTiming(1, ANIMATION_CONFIG))
  }, [isFavorited])

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])

  return (
    <AnimatedFlex style={animatedStyle}>
      <HeartIcon color={color} height={size} width={size} />
    </AnimatedFlex>
  )
}
