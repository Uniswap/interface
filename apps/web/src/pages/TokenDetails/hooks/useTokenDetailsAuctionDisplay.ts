import { useContext } from 'react'
import { TokenDetailsAuctionDisplayContext } from '~/pages/TokenDetails/context/TokenDetailsAuctionDisplayProvider'
import type { TokenDetailsAuctionDisplay } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'

export interface TokenDetailsAuctionDisplayModel extends TokenDetailsAuctionDisplay {
  isInitialLoading: boolean
  /** True until the token is known not to be auction-only: the auction lookup, its pool, or its phase is still in flight. */
  isAuctionOnlyPending: boolean
  /** Latches once this auction's pool is confirmed, so a later refetch cannot retract what is already on screen. */
  hasConfirmedPool: boolean
  /** Re-reads the chain head so the phase flips from blocks, never from the browser clock. */
  refetchCurrentBlock: () => void
}

export function useTokenDetailsAuctionDisplay(): TokenDetailsAuctionDisplayModel {
  const display = useContext(TokenDetailsAuctionDisplayContext)
  if (!display) {
    throw new Error('useTokenDetailsAuctionDisplay requires TokenDetailsAuctionDisplayProvider')
  }
  return display
}
