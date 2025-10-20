import { AuctionStoreContext } from 'components/Toucan/Auction/store/AuctionStoreContext'
import { AuctionStore } from 'components/Toucan/Auction/store/createAuctionStore'
import { AuctionStoreState } from 'components/Toucan/Auction/store/types'
import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

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

export function useAuctionStoreActions(): AuctionStoreState['actions'] {
  const store = useAuctionStoreBase()

  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
