import { useEffect, useMemo } from 'react'
import { formatUnits } from 'viem'
import {
  BidConcentrationResult,
  calculateBidConcentration,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'

/**
 * Converts a value from smallest unit to decimal using viem's formatUnits
 */
function toDecimal(value: string, decimals: number): number {
  return Number(formatUnits(BigInt(value), decimals))
}

/**
 * Hook that computes the bid concentration band from bid distribution data.
 * This runs at the provider level to ensure concentration data is available
 * for both the stats banner and the distribution chart.
 *
 * The concentration calculation requires:
 * - Bid distribution data from GetBids API
 * - Clearing price (to filter bids at or above clearing)
 * - Bid token info (for converting volumes)
 */
export function useComputeConcentrationBand(): void {
  const { setConcentrationBand } = useAuctionStoreActions()

  const { auctionDetails, bidDistributionData, checkpointData, onchainCheckpoint, auctionProgressState } =
    useAuctionStore((state) => ({
      auctionDetails: state.auctionDetails,
      bidDistributionData: state.bidDistributionData,
      checkpointData: state.checkpointData,
      onchainCheckpoint: state.onchainCheckpoint,
      auctionProgressState: state.progress.state,
    }))

  // Get bid token info for volume conversion
  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  // Compute concentration band whenever dependencies change
  const concentrationBand = useMemo((): BidConcentrationResult | null => {
    if (!bidDistributionData || !auctionDetails || !bidTokenInfo) {
      return null
    }

    // Use on-chain clearing price during active auction for consistency with isInRange
    // Use simulated clearing price when auction has ended (preserves final state)
    const isAuctionActive = auctionProgressState === AuctionProgressState.IN_PROGRESS
    const effectiveCheckpoint = isAuctionActive ? onchainCheckpoint : checkpointData
    const clearingPrice = getClearingPrice(effectiveCheckpoint, auctionDetails)
    const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
    const clearingPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: clearingPrice,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })

    // Convert bid distribution data to the format expected by calculateBidConcentration
    // We need to create bars with tick, tickQ96, amount, and index
    // When priceFiat is available, convert to fiat for consistency with chart calculations
    // When priceFiat is unavailable (e.g., testnets), use bid token amounts for concentration math
    const entries = Array.from(bidDistributionData.entries())
      .map(([tickQ96, volume], index) => {
        const volumeInBidToken = toDecimal(volume, bidTokenInfo.decimals)
        return {
          tick: fromQ96ToDecimalWithTokenDecimals({
            q96Value: tickQ96,
            bidTokenDecimals: bidTokenInfo.decimals,
            auctionTokenDecimals,
          }),
          tickQ96,
          amount: bidTokenInfo.priceFiat > 0 ? volumeInBidToken * bidTokenInfo.priceFiat : volumeInBidToken,
          index,
        }
      })
      .sort((a, b) => a.tick - b.tick)

    // Re-index after sorting
    const sortedBars = entries.map((entry, idx) => ({ ...entry, index: idx }))

    if (sortedBars.length === 0) {
      return null
    }

    return calculateBidConcentration({
      bars: sortedBars,
      clearingPrice: clearingPriceDecimal,
    })
  }, [bidDistributionData, auctionDetails, bidTokenInfo, checkpointData, onchainCheckpoint, auctionProgressState])

  // Update store when concentration band changes
  useEffect(() => {
    setConcentrationBand(concentrationBand)
  }, [concentrationBand, setConcentrationBand])
}
