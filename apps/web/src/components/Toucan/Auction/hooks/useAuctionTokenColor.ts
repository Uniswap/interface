import { useSporeColors } from 'ui/src'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

/**
 * Centralized token color selector for the auction experience.
 * Provides the raw store values plus an effective color that
 * uses a neutral fallback while extraction is loading.
 */
export function useAuctionTokenColor(): {
  tokenColor?: string
  tokenColorLoading: boolean
  effectiveTokenColor: string
} {
  const colors = useSporeColors()
  const { tokenColor, tokenColorLoading } = useAuctionStore((state) => ({
    tokenColor: state.tokenColor,
    tokenColorLoading: state.tokenColorLoading,
  }))

  // Prefer extracted token color; otherwise use a stable neutral fallback
  const effectiveTokenColor = tokenColor ?? colors.neutral3.val

  return { tokenColor, tokenColorLoading, effectiveTokenColor }
}
