import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AuctionDetailsLoadState, AuctionStoreState, BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { computeAuctionProgress } from '~/components/Toucan/Auction/utils/computeAuctionProgress'

export type AuctionStore = UseBoundStore<StoreApi<AuctionStoreState>>

export const createAuctionStore = (auctionAddress?: string, chainId?: EVMUniverseChainId): AuctionStore => {
  const INITIAL_CURRENT_BLOCK: number | undefined = undefined

  const INITIAL_PROGRESS = computeAuctionProgress({
    currentBlock: INITIAL_CURRENT_BLOCK,
    auctionDetails: null,
    checkpointData: null,
  })

  return create<AuctionStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        auctionAddress,
        chainId,
        auctionDetails: null,
        auctionDetailsLoadState: AuctionDetailsLoadState.Idle,
        auctionDetailsError: null,
        checkpointData: null,
        onchainCheckpoint: null,
        tokenColor: undefined, // Will be set by useSrcColor in provider
        tokenColorLoading: true,
        currentBlockNumber: INITIAL_CURRENT_BLOCK,
        progress: INITIAL_PROGRESS,
        chartZoomStates: {
          distribution: { visibleRange: null, isZoomed: false },
          demand: { visibleRange: null, isZoomed: false },
        },
        clearingPriceZoomState: { visibleRange: null, isZoomed: false },
        chartZoomCommand: null,
        groupTicksEnabled: false,
        tickGrouping: null,
        chartHoverResetKey: 0,
        // Populated via API once wallet bids are fetched
        userBids: [],
        // Whether the initial user bids fetch has completed (used to avoid tab flash on load)
        userBidsInitialized: false,
        // Price selected from chart click
        selectedTickPrice: null,
        // User's current bid price from max valuation input
        userBidPrice: null,
        // Custom bid tick for rendering out-of-range bids
        customBidTick: {
          tickValue: null,
        },
        // Concentration band for the chart, used for reset zoom
        concentrationBand: null,
        // Bid distribution data from GetBids API
        bidDistributionData: null,
        // Volume from bids excluded due to MAX_RENDERABLE_BARS cap
        excludedBidVolume: null,
        // Callback to manually refetch user bids (used after withdrawal transactions)
        refetchUserBids: null,
        // Active tab in BidFormTabs - default to PLACE_A_BID
        activeBidFormTab: BidInfoTab.PLACE_A_BID,
        // Optimistic bid for immediate UI feedback after bid submission
        optimisticBid: null,
        // Previous bids count for detecting when API returns new bid
        previousBidsCount: 0,
        // Per-bid tracking of withdrawal state - bidIds that are pending or awaiting confirmation
        pendingWithdrawalBidIds: new Set<string>(),
        awaitingConfirmationBidIds: new Set<string>(),
        withdrawalTxHashes: new Map<string, string>(),

        // Actions
        actions: {
          setTokenColor: (color) => {
            set({ tokenColor: color })
          },
          setTokenColorLoading: (loading) => {
            set({ tokenColorLoading: loading })
          },
          setUserBids: (bids) => {
            set({ userBids: bids })
          },
          setUserBidsInitialized: (initialized) => {
            set({ userBidsInitialized: initialized })
          },
          /**
           * Updates the current block number and automatically recomputes all auction progress state.
           * This will update progress.state, progress.blocksRemaining, progress.progressPercentage, and progress.isGraduated.
           * @param blockNumber - The new current block number from the blockchain
           */
          setCurrentBlockNumberAndUpdateProgress: (blockNumber) => {
            set((state) => {
              const progress = computeAuctionProgress({
                currentBlock: blockNumber,
                auctionDetails: state.auctionDetails,
                checkpointData: state.checkpointData,
              })
              return {
                currentBlockNumber: blockNumber,
                progress,
              }
            })
          },
          setChartZoomState: (chartMode, state) => {
            set((prev) => ({
              chartZoomStates: { ...prev.chartZoomStates, [chartMode]: state },
            }))
          },
          setClearingPriceZoomState: (state) => {
            set({ clearingPriceZoomState: state })
          },
          requestChartZoom: (target, action) => {
            set({
              chartZoomCommand: {
                target,
                action,
              },
            })
          },
          clearChartZoomCommand: () => {
            set({ chartZoomCommand: null })
          },
          setGroupTicksEnabled: (enabled) => {
            set({ groupTicksEnabled: enabled })
          },
          setTickGrouping: (grouping) => {
            set({ tickGrouping: grouping })
          },
          incrementChartHoverResetKey: () => {
            set((state) => ({
              chartHoverResetKey: state.chartHoverResetKey + 1,
            }))
          },
          resetChartZoom: (chartMode) => {
            set((state) => {
              const resetState = state.concentrationBand
                ? {
                    visibleRange: {
                      from: state.concentrationBand.startTick,
                      to: state.concentrationBand.endTick,
                    },
                    isZoomed: false,
                  }
                : { visibleRange: null, isZoomed: false }

              if (chartMode) {
                return {
                  chartZoomStates: {
                    ...state.chartZoomStates,
                    [chartMode]: resetState,
                  },
                }
              }
              // Reset both if no chartMode specified
              return {
                chartZoomStates: {
                  distribution: resetState,
                  demand: resetState,
                },
              }
            })
          },
          setAuctionDetails: (details) => {
            set((state) => {
              const progress = computeAuctionProgress({
                currentBlock: state.currentBlockNumber,
                auctionDetails: details,
                checkpointData: state.checkpointData,
              })
              return {
                auctionDetails: details,
                // Recompute progress since auction details contain start/end blocks
                progress,
              }
            })
          },
          setAuctionDetailsLoadState: (state, error = null) => {
            set({
              auctionDetailsLoadState: state,
              auctionDetailsError: error ?? null,
            })
          },
          setCheckpointData: (data) => {
            set((state) => ({
              checkpointData: data,
              // Recompute progress since checkpoint data affects graduation status
              progress: computeAuctionProgress({
                currentBlock: state.currentBlockNumber,
                auctionDetails: state.auctionDetails,
                checkpointData: data,
              }),
            }))
          },
          setOnchainCheckpoint: (data) => {
            set({ onchainCheckpoint: data })
          },
          setSelectedTickPrice: (price) => {
            set({ selectedTickPrice: price })
          },
          setUserBidPrice: (price) => {
            set({ userBidPrice: price })
          },
          setCustomBidTick: (tickValue) => {
            set({ customBidTick: { tickValue } })
          },
          setConcentrationBand: (band) => {
            set({ concentrationBand: band })
          },
          setBidDistributionData: (data, excludedVolume) => {
            set({ bidDistributionData: data, excludedBidVolume: excludedVolume ?? null })
          },
          setRefetchUserBids: (refetchFn) => {
            set({ refetchUserBids: refetchFn })
          },
          setActiveBidFormTab: (tab) => {
            set({ activeBidFormTab: tab })
          },
          setOptimisticBid: (bid) => {
            set({ optimisticBid: bid })
          },
          setPreviousBidsCount: (count) => {
            set({ previousBidsCount: count })
          },
          // Per-bid withdrawal state management - create new Set/Map instances for immutability
          addPendingWithdrawalBid: (bidId, txHash) => {
            set((state) => ({
              pendingWithdrawalBidIds: new Set([...state.pendingWithdrawalBidIds, bidId]),
              withdrawalTxHashes: new Map([...state.withdrawalTxHashes, [bidId, txHash]]),
            }))
          },
          removePendingWithdrawalBid: (bidId) => {
            set((state) => {
              const newPendingIds = new Set(state.pendingWithdrawalBidIds)
              newPendingIds.delete(bidId)
              const newTxHashes = new Map(state.withdrawalTxHashes)
              newTxHashes.delete(bidId)
              return {
                pendingWithdrawalBidIds: newPendingIds,
                withdrawalTxHashes: newTxHashes,
              }
            })
          },
          addAwaitingConfirmationBid: (bidId) => {
            set((state) => ({
              awaitingConfirmationBidIds: new Set([...state.awaitingConfirmationBidIds, bidId]),
            }))
          },
          removeAwaitingConfirmationBid: (bidId) => {
            set((state) => {
              const newAwaitingIds = new Set(state.awaitingConfirmationBidIds)
              newAwaitingIds.delete(bidId)
              return {
                awaitingConfirmationBidIds: newAwaitingIds,
              }
            })
          },
          clearAllWithdrawalStateForBid: (bidId) => {
            set((state) => {
              const newPendingIds = new Set(state.pendingWithdrawalBidIds)
              newPendingIds.delete(bidId)
              const newAwaitingIds = new Set(state.awaitingConfirmationBidIds)
              newAwaitingIds.delete(bidId)
              const newTxHashes = new Map(state.withdrawalTxHashes)
              newTxHashes.delete(bidId)
              return {
                pendingWithdrawalBidIds: newPendingIds,
                awaitingConfirmationBidIds: newAwaitingIds,
                withdrawalTxHashes: newTxHashes,
              }
            })
          },
          clearAllWithdrawalState: () => {
            set({
              pendingWithdrawalBidIds: new Set<string>(),
              awaitingConfirmationBidIds: new Set<string>(),
              withdrawalTxHashes: new Map<string, string>(),
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
