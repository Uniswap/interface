import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import type { CreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import type { CreateAuctionStoreState } from '~/pages/Liquidity/CreateAuction/types'

function useCreateAuctionStoreBase(): CreateAuctionStore {
  const context = useContext(CreateAuctionStoreContext)

  if (!context) {
    throw new Error('useCreateAuctionStore must be used within CreateAuctionContextProvider')
  }

  return context
}

export function useCreateAuctionStore<T>(selector: (state: Omit<CreateAuctionStoreState, 'actions'>) => T): T {
  const store = useCreateAuctionStoreBase()

  return useStore(store, useShallow(selector))
}

export function useCreateAuctionStoreActions(): CreateAuctionStoreState['actions'] {
  const store = useCreateAuctionStoreBase()

  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}
