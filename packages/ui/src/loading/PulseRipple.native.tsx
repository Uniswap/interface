import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

export const PulseRipple = ({ rippleColor, size = 24 }: { rippleColor?: string; size: number }): JSX.Element | null => {
  const scaleAnimation = useRef(new Animated.Value(1)).current
  const opacityAnimation = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const scaleAnim = Animated.timing(scaleAnimation, {
      toValue: 1.5,
      duration: 1000,
      useNativeDriver: true,
    })
    const opacityAnim = Animated.timing(opacityAnimation, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    })
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.parallel([scaleAnim, opacityAnim]),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start()
    return (): void => {
      scaleAnimation.stopAnimation()
      opacityAnimation.stopAnimation()
    }
  }, [scaleAnimation, opacityAnimation])

  if (!rippleColor) {
    return null
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: rippleColor,
        transform: [{ scale: scaleAnimation }],
        opacity: opacityAnimation,
      }}
    />
  )
}
