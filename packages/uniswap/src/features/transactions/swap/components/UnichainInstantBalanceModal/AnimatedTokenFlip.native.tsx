import { useEffect, useState } from 'react'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Flex } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

interface AnimatedTokenFlipProps {
  size: number
  inputCurrencyInfo: CurrencyInfo
  outputCurrencyInfo: CurrencyInfo
}

export function AnimatedTokenFlip({
  size,
  inputCurrencyInfo,
  outputCurrencyInfo,
}: AnimatedTokenFlipProps): JSX.Element {
  const [processingState, setProcessingState] = useState<'processing' | 'complete'>('complete')
  const flipAnimation = useSharedValue(0)

  useEffect(() => {
    flipAnimation.value = withTiming(processingState === 'complete' ? 1 : 0, {
      duration: 600,
      easing: Easing.bezier(0.68, -0.3, 0.265, 1.3),
    })
  }, [processingState])

  const handleTokenClick = (): void => {
    setProcessingState((prev) => (prev === 'complete' ? 'processing' : 'complete'))
  }

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnimation.value, [0, 1], [0, 540])
    const scale = interpolate(flipAnimation.value, [0, 1], [0.75, 1])
    const opacity = interpolate(flipAnimation.value, [0, 0.5, 1], [1, 0, 0])

    return {
      transform: [{ rotateY: `${rotateY}deg` }, { scale }],
      opacity,
    }
  }, [flipAnimation])

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnimation.value, [0, 1], [180, 720])
    const scale = interpolate(flipAnimation.value, [0, 1], [0.75, 1])
    const opacity = interpolate(flipAnimation.value, [0, 0.5, 1], [0, 0, 1])

    return {
      transform: [{ rotateY: `${rotateY}deg` }, { scale }],
      opacity,
    }
  }, [flipAnimation])

  return (
    <Flex width={size} height={size} alignItems="center" justifyContent="center" mb="$spacing24">
      <Flex
        animation="300ms"
        width={size}
        height={size}
        scale={1}
        opacity={1}
        enterStyle={{
          x: 140,
          y: -80,
          scale: 0.5,
          opacity: 0,
        }}
      >
        <Flex position="relative" width={size} height={size} onPress={handleTokenClick}>
          {/* Front side - Input token */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
              },
              frontAnimatedStyle,
            ]}
          >
            <TokenLogo
              chainId={inputCurrencyInfo.currency.chainId}
              name={inputCurrencyInfo.currency.name}
              symbol={inputCurrencyInfo.currency.symbol}
              url={inputCurrencyInfo.logoUrl}
              webFontSize={size / 4}
              lineHeight="unset"
              size={size}
            />
          </Animated.View>

          {/* Back side - Output token */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
              },
              backAnimatedStyle,
            ]}
          >
            <TokenLogo
              chainId={outputCurrencyInfo.currency.chainId}
              name={outputCurrencyInfo.currency.name}
              symbol={outputCurrencyInfo.currency.symbol}
              url={outputCurrencyInfo.logoUrl}
              webFontSize={size / 4}
              lineHeight="unset"
              size={size}
            />
          </Animated.View>
        </Flex>
      </Flex>
    </Flex>
  )
}
