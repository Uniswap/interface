import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { AuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { AuctionOutcome, AuctionStoreState } from '~/features/Toucan/Auction/store/types'

function useAuctionStoreBase(): AuctionStore {
  const context = useContext(AuctionStoreContext)

  if (!context) {
    throw new Error('useAuctionStore must be used within AuctionStoreProvider')
  }

  return context
}

export function useAuctionStore<T>(selector: (state: Omit<AuctionStoreState, 'actions'>) => T): T {
  const store = useAuctionStoreBase()

  return useStore(store, useShallow(selector))
}

/**
 * Explicit derived outcome (active / graduated / failed) for the current auction.
 * Recomputed whenever the current block, auction details, or checkpoint data change.
 */
export function useAuctionOutcome(): AuctionOutcome {
  return useAuctionStore((state) => state.progress.outcome)
}

/**
 * Single source of truth for "the auction ended without graduating". Shared by
 * the bids list, bid details, and timeline so the failed-launch condition is
 * defined in one place rather than re-derived from different signals.
 */
export function useIsAuctionFailed(): boolean {
  return useAuctionStore((state) => state.progress.outcome === AuctionOutcome.FAILED)
}

export function useAuctionStoreActions(): AuctionStoreState['actions'] {
  const store = useAuctionStoreBase()

  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
