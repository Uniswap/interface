import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { DIGIT_HEIGHT } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'

export const TopAndBottomGradient = (): JSX.Element => {
  const colors = useSporeColors()

  return (
    <svg height={DIGIT_HEIGHT} style={{ position: 'absolute', zIndex: 100 }} width="100%">
      <defs>
        <linearGradient id="backgroundTop" x1="0%" x2="0%" y1="15%" y2="0%">
          <stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="background" x1="0%" x2="0%" y1="85%" y2="100%">
          <stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect fill="url(#backgroundTop)" height={DIGIT_HEIGHT} opacity={1} width="100%" x="0" y="0" />
      <rect fill="url(#background)" height={DIGIT_HEIGHT} opacity={1} width="100%" x="0" y="0" />
    </svg>
  )
}
