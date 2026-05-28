import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { getConcentrationColor } from '~/features/Toucan/ToucanChart/utils/colors'

/**
 * Hook to get the concentration band color based on the token color.
 * The concentration color is the token color with 24% white overlay.
 * Falls back to accent1 if no token color is set.
 */
export function useConcentrationColor(): string {
  const colors = useSporeColors()
  const { tokenColor, tokenColorLoading } = useAuctionTokenColor()

  return useMemo(() => {
    return getConcentrationColor({
      tokenColor,
      fallbackAccentColor: tokenColorLoading ? colors.neutral3.val : colors.accent1.val,
    })
  }, [tokenColor, tokenColorLoading, colors.accent1.val, colors.neutral3.val])
}
