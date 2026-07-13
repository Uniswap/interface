import { useId } from 'react'
import { StyleSheet } from 'react-native'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

/** Default digit rail height; matches AnimatedNumber.native DIGIT_HEIGHT. */
const DEFAULT_DIGIT_HEIGHT = 40

const AnimatedNumberStyles = StyleSheet.create({
  gradientStyle: {
    position: 'absolute',
    zIndex: 100,
  },
})

interface TopAndBottomGradientProps {
  height?: number
}

export const TopAndBottomGradient = ({ height = DEFAULT_DIGIT_HEIGHT }: TopAndBottomGradientProps): JSX.Element => {
  const colors = useSporeColors()
  const gradientId = useId().replace(/:/g, '')
  const topGradientId = `${gradientId}-top`
  const bottomGradientId = `${gradientId}-bottom`

  return (
    <Svg height={height} pointerEvents="none" style={AnimatedNumberStyles.gradientStyle} width="100%">
      <Defs>
        <LinearGradient id={topGradientId} x1="0%" x2="0%" y1="15%" y2="0%">
          <Stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id={bottomGradientId} x1="0%" x2="0%" y1="85%" y2="100%">
          <Stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect fill={`url(#${topGradientId})`} height={height} opacity={1} width="100%" x="0" y="0" />
      <Rect fill={`url(#${bottomGradientId})`} height={height} opacity={1} width="100%" x="0" y="0" />
    </Svg>
  )
}
