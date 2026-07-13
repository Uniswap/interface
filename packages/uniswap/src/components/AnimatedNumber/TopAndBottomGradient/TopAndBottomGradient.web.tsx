import { useId } from 'react'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

/** Default digit rail height; matches native DIGIT_HEIGHT / heading2 lineHeight. */
const DEFAULT_DIGIT_HEIGHT = 40

interface TopAndBottomGradientProps {
  height?: number
}

export const TopAndBottomGradient = ({ height = DEFAULT_DIGIT_HEIGHT }: TopAndBottomGradientProps): JSX.Element => {
  const colors = useSporeColors()
  const gradientId = useId().replace(/:/g, '')
  const topGradientId = `${gradientId}-top`
  const bottomGradientId = `${gradientId}-bottom`

  return (
    <svg height={height} style={{ position: 'absolute', zIndex: 100, pointerEvents: 'none' }} width="100%">
      <defs>
        <linearGradient id={topGradientId} x1="0%" x2="0%" y1="15%" y2="0%">
          <stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={bottomGradientId} x1="0%" x2="0%" y1="85%" y2="100%">
          <stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect fill={`url(#${topGradientId})`} height={height} opacity={1} width="100%" x="0" y="0" />
      <rect fill={`url(#${bottomGradientId})`} height={height} opacity={1} width="100%" x="0" y="0" />
    </svg>
  )
}
