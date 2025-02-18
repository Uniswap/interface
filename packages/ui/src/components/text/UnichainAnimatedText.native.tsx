import MaskedView from '@react-native-masked-view/masked-view'
import { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'tamagui/linear-gradient'
import { Text } from 'ui/src/components/text'
import { UnichainAnimatedTextProps } from 'ui/src/components/text/UnichainAnimatedText'

export function UnichainAnimatedText({
  children,
  gradientTextColor,
  delayMs = 375,
  enabled = true,
  gradientEndingXPlacement = -125,
  ...props
}: UnichainAnimatedTextProps): JSX.Element {
  const translateX = useSharedValue(0)

  useEffect(() => {
    if (enabled) {
      translateX.value = withDelay(delayMs, withSequence(withTiming(gradientEndingXPlacement, { duration: 600 })))
    }
  }, [delayMs, enabled, gradientEndingXPlacement, translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  if (!enabled) {
    return <Text {...props}>{children}</Text>
  }

  return (
    <MaskedView maskElement={<Text {...props}>{children}</Text>}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={[gradientTextColor, gradientTextColor, '#FA0ABF', '#FC63DF', gradientTextColor, gradientTextColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          width="500%"
        >
          <Text {...props} opacity={0}>
            {children}
          </Text>
        </LinearGradient>
      </Animated.View>
    </MaskedView>
  )
}
