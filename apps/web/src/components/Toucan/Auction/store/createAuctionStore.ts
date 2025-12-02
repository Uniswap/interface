import { FAKE_AUCTION_DATA, FAKE_CHECKPOINT_DATA } from 'components/Toucan/Auction/store/mockData'
import { AuctionProgressState, AuctionStoreState, DisplayMode } from 'components/Toucan/Auction/store/types'
import { computeAuctionProgress } from 'components/Toucan/Auction/utils/computeAuctionProgress'
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
        displayMode: DisplayMode.VALUATION,
        currentBlockNumber: undefined,
        progress: {
          state: AuctionProgressState.NOT_STARTED,
          blocksRemaining: undefined,
          progressPercentage: undefined,
          isGraduated: false,
        },
        chartZoomState: {
          visibleRange: null,
          isZoomed: false,
        },

        // Actions
        actions: {
          setTokenColor: (color) => {
            set({ tokenColor: color })
          },
          setDisplayMode: (mode) => {
            set({ displayMode: mode })
          },
          /**
           * Updates the current block number and automatically recomputes all auction progress state.
           * This will update progress.state, progress.blocksRemaining, progress.progressPercentage, and progress.isGraduated.
           * @param blockNumber - The new current block number from the blockchain
           */
          setCurrentBlockNumberAndUpdateProgress: (blockNumber) => {
            set((state) => ({
              currentBlockNumber: blockNumber,
              progress: computeAuctionProgress({
                currentBlock: blockNumber,
                auctionDetails: state.auctionDetails,
              }),
            }))
          },
          setChartZoomState: (state) => {
            set({ chartZoomState: state })
          },
          resetChartZoom: () => {
            set({
              chartZoomState: {
                visibleRange: null,
                isZoomed: false,
              },
            })
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
