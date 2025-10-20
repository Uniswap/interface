import { FAKE_AUCTION_DATA, FAKE_CHECKPOINT_DATA } from 'components/Toucan/Auction/store/mockData'
import { AuctionStoreState } from 'components/Toucan/Auction/store/types'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type AuctionStore = UseBoundStore<StoreApi<AuctionStoreState>>

export const createAuctionStore = (_auctionId?: string): AuctionStore => {
  return create<AuctionStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        auctionDetails: FAKE_AUCTION_DATA,
        checkpointData: FAKE_CHECKPOINT_DATA,
        tokenColor: undefined, // Will be set by useSrcColor in provider

        // Actions
        actions: {
          setTokenColor: (color) => {
            set({ tokenColor: color })
          },
        },
      }),
      {
        name: 'useAuctionStore',
        enabled: process.env.NODE_ENV === 'development',
      },
    ),
  )
}
