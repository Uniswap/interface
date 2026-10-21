import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import {
  mayShowNowTradingCard,
  shouldShowNowTradingCard,
} from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import { isTradingRestrictedUntilTge } from '~/features/Toucan/Config/config'

interface NowTradingCardVisibility {
  /** Everything the card needs is settled in its favour. */
  isVisible: boolean
  /** It may still get there, so the slot shows the card's skeleton instead of collapsing. */
  mayBecomeVisible: boolean
}

/** Shared by the card and the panel-state mirror so the two cannot disagree. */
export function useNowTradingCardVisibility(): NowTradingCardVisibility {
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const state = useAuctionDisplayState()

  if (auctionDetails === null) {
    return { isVisible: false, mayBecomeVisible: false }
  }

  const tradingRestrictedUntilTge = isTradingRestrictedUntilTge({
    chainId: auctionDetails.chainId,
    tokenAddress: auctionDetails.tokenAddress,
  })
  return {
    isVisible: shouldShowNowTradingCard({ state, tradingRestrictedUntilTge }),
    mayBecomeVisible: mayShowNowTradingCard({ state, tradingRestrictedUntilTge }),
  }
}
