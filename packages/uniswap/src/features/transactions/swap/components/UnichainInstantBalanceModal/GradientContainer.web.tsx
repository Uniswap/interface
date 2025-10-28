import { useEffect, useMemo } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Flex } from 'ui/src'
import { GradientContainerProps } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/GradientContainer'
import { useBackgroundColor } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useBackgroundColor'

export function GradientContainer({ toTokenColor, children }: GradientContainerProps): JSX.Element {
  const backgroundColor = useBackgroundColor()
  const baseBlobStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      backgroundColor: toTokenColor,
      filter: 'blur(65px)',
      shadowColor: toTokenColor,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 0 },
    }),
    [toTokenColor],
  )

  const blobT1 = useSharedValue(0)
  const blobT2 = useSharedValue(0)
  const blobT3 = useSharedValue(0)

  useEffect(() => {
    const cfg = { duration: 20000, easing: Easing.inOut(Easing.ease) }
    blobT1.value = withRepeat(withTiming(1, cfg), -1, true)
    blobT2.value = withRepeat(withTiming(1, { ...cfg, duration: 16000 }), -1, true)
    blobT3.value = withRepeat(withTiming(1, { ...cfg, duration: 7000 }), -1, true)
  }, [])

  const blob1 = useAnimatedStyle(() => {
    const innerT = blobT1.value * Math.PI * 2
    const x = 40 * Math.sin(innerT) + -20 * Math.sin(2 * innerT)
    const y = -30 * Math.cos(innerT) + 20 * Math.cos(1.5 * innerT)
    const scale = 1 + 0.1 * Math.sin(innerT) - 0.15 * Math.sin(2 * innerT)
    const rotate = 12 * Math.sin(innerT)
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }, { rotate: `${rotate}deg` }],
    }
  }, [blobT1])

  const blob2 = useAnimatedStyle(() => {
    const innerT = blobT2.value * Math.PI * 2
    const x = -35 * Math.sin(innerT) + 15 * Math.cos(1.2 * innerT) + 45 * Math.sin(0.8 * innerT)
    const y = 20 * Math.cos(innerT) - 40 * Math.sin(1.1 * innerT) + 10 * Math.cos(0.7 * innerT)
    const scale = 1 + 0.12 * Math.sin(1.3 * innerT) - 0.1 * Math.cos(0.9 * innerT)
    const rotate = -16 * Math.cos(innerT) + 20 * Math.sin(1.1 * innerT)
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }, { rotate: `${rotate}deg` }],
    }
  }, [blobT2])

  const blob3 = useAnimatedStyle(() => {
    const innerT = blobT3.value * Math.PI * 2
    const x = 30 * Math.sin(innerT) - 40 * Math.sin(1.4 * innerT)
    const y = 45 * Math.cos(innerT) - 15 * Math.cos(1.2 * innerT) - 35 * Math.sin(0.9 * innerT)
    const scale = 1 + 0.25 * Math.sin(1.1 * innerT) - 0.2 * Math.cos(0.7 * innerT)
    const rotate = 24 * Math.sin(innerT) - 18 * Math.cos(1.2 * innerT)
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }, { rotate: `${rotate}deg` }],
    }
  }, [blobT3])

  return (
    <Flex background={backgroundColor} borderRadius="$rounded16" overflow="hidden" position="relative">
      <Flex position="absolute" inset={0} overflow="hidden">
        <Animated.View
          style={[baseBlobStyle, { width: 96, height: 96, borderRadius: 48, left: '15%', top: '10%' }, blob1]}
        />

        <Animated.View
          style={[
            baseBlobStyle,
            {
              width: 80,
              height: 80,
              borderRadius: 40,
              right: '20%',
              top: '25%',
              shadowRadius: 25,
            },
            blob2,
          ]}
        />

        <Animated.View
          style={[
            baseBlobStyle,
            {
              width: 72,
              height: 72,
              borderRadius: 36,
              left: '35%',
              bottom: '15%',
              shadowRadius: 20,
            },
            blob3,
          ]}
        />
      </Flex>
      {children}
    </Flex>
  )
}
