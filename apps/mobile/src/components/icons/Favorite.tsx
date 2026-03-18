import React, { useCallback, useEffect, useState } from 'react'
import { useAnimatedStyle, useDerivedValue, withSequence, withTiming } from 'react-native-reanimated'
import { Flex, useSporeColors } from 'ui/src'
import { HeartWithFill } from 'ui/src/components/icons'

interface FavoriteButtonProps {
  isFavorited: boolean
  size: number
}

const DELAY = 100
const ANIMATION_CONFIG = { duration: DELAY }

export const Favorite = ({ isFavorited, size }: FavoriteButtonProps): JSX.Element => {
  const colors = useSporeColors()
  const unfilledColor = colors.neutral2.val

  const getColor = useCallback(
    () => (isFavorited ? colors.accent1.val : unfilledColor),
    [isFavorited, colors.accent1, unfilledColor],
  )

  const [color, setColor] = useState(getColor())

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to recalculate this when isFavorited changes
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
    <Flex animation={null} style={animatedStyle}>
      <HeartWithFill color={color} height={size} width={size} />
    </Flex>
  )
}
