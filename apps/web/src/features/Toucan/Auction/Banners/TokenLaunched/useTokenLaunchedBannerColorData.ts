import { useMemo } from 'react'
import { opacifyRaw } from 'ui/src/theme/color/utils'

const BANNER_ACCENT_OPACITY = 15

interface UseTokenLaunchedBannerDataProps {
  tokenColor?: string
  tokenColorLoading?: boolean
  colors: {
    surface1: { val: string }
    surface2: { val: string }
    surface3: { val: string }
    accent1: { val: string }
    neutral3?: { val: string }
  }
  gradientLtr?: boolean
}

export function useTokenLaunchedBannerColorData({
  tokenColor,
  colors,
  gradientLtr = true,
  tokenColorLoading,
}: UseTokenLaunchedBannerDataProps) {
  const fallbackColor = colors.neutral3?.val ?? colors.surface3.val
  const accentColor = tokenColor ?? (tokenColorLoading ? fallbackColor : colors.accent1.val)

  const bannerGradient = useMemo(() => {
    const surface2 = colors.surface2.val
    const accentSoft = opacifyRaw(BANNER_ACCENT_OPACITY, accentColor)
    const dots = opacifyRaw(10, accentSoft)

    let backgroundImage = `radial-gradient(circle at 1px 1px, ${dots} 1px, transparent 0)`
    if (gradientLtr) {
      backgroundImage += `, linear-gradient(270deg, ${surface2} 0%, ${surface2} 75%, ${accentSoft} 100%)`
    }

    return {
      backgroundImage,
      backgroundSize: '10px 10px, 100% 100%',
    }
  }, [accentColor, colors.surface2.val, gradientLtr])

  return {
    bannerGradient,
    accentColor,
  }
}
