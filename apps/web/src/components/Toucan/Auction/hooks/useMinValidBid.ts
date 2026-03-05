import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { calculateMinValidBidQ96, isBidBelowMinimum } from '~/components/Toucan/Auction/utils/ticks'

interface UseMinValidBidParams {
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  tickSizeQ96: bigint | undefined
  bidTokenDecimals: number | undefined
  auctionTokenDecimals: number | undefined
}

interface MinValidBidResult {
  /** The minimum valid bid in Q96 format (first tick strictly above clearing price) */
  minValidBidQ96: bigint | undefined
  /** The minimum valid bid as a decimal string for display */
  minValidBidDisplay: string | undefined
  /** The minimum valid bid formatted for UI display */
  minValidBidFormatted: string | undefined
  /** Check if a given bid price is below the minimum valid bid */
  isBelowMinimum: (bidPriceQ96: bigint) => boolean
}

/**
 * Hook that calculates the minimum valid bid according to contract rules.
 *
 * Contract constraints (ContinuousClearingAuction.sol):
 * 1. Bids must be at tick boundaries (TickStorage.sol:42)
 * 2. Bids must be strictly above the clearing price (ContinuousClearingAuction.sol:409)
 *
 * Scenarios:
 * - At auction start: clearing price = floor price, minimum bid = floor + 1 tick
 * - Clearing price between ticks: minimum bid = next tick strictly above clearing
 * - Clearing price exactly at a tick: minimum bid = clearing + 1 tick (must be strictly above)
 */
export function useMinValidBid({
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  bidTokenDecimals,
  auctionTokenDecimals,
}: UseMinValidBidParams): MinValidBidResult {
  const { formatNumberOrString } = useLocalizationContext()

  const minValidBidQ96 = useMemo(() => {
    if (!clearingPriceQ96 || !floorPriceQ96 || !tickSizeQ96) {
      return undefined
    }
    return calculateMinValidBidQ96({
      clearingPriceQ96,
      floorPriceQ96,
      tickSizeQ96,
    })
  }, [clearingPriceQ96, floorPriceQ96, tickSizeQ96])

  const minValidBidDisplay = useMemo(() => {
    if (!minValidBidQ96 || bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
      return undefined
    }
    return q96ToPriceString({
      q96Value: minValidBidQ96,
      bidTokenDecimals,
      auctionTokenDecimals,
    })
  }, [minValidBidQ96, bidTokenDecimals, auctionTokenDecimals])

  const minValidBidFormatted = useMemo(() => {
    if (!minValidBidDisplay) {
      return undefined
    }
    const numeric = Number(minValidBidDisplay)
    if (!Number.isFinite(numeric)) {
      return minValidBidDisplay
    }
    return formatNumberOrString({ value: numeric, type: NumberType.TokenNonTx })
  }, [minValidBidDisplay, formatNumberOrString])

  const isBelowMinimum = useMemo(() => {
    return (bidPriceQ96: bigint): boolean => {
      if (!clearingPriceQ96 || !floorPriceQ96 || !tickSizeQ96) {
        return false
      }
      return isBidBelowMinimum({
        bidPriceQ96,
        clearingPriceQ96,
        floorPriceQ96,
        tickSizeQ96,
      })
    }
  }, [clearingPriceQ96, floorPriceQ96, tickSizeQ96])

  return {
    minValidBidQ96,
    minValidBidDisplay,
    minValidBidFormatted,
    isBelowMinimum,
  }
}
