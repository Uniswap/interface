import { calculateMaxValidBidQ96, isMaxBidPriceReached } from '@universe/cca'
import { useMemo, useRef } from 'react'
import {
  getMaxBidPriceQ96,
  useVerifyWalletQuery,
} from 'uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useVerifyWalletParams } from '~/features/Toucan/Auction/hooks/useVerifyWalletParams'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'

export interface AuctionMaxBidPrice {
  /** The hook's raw ceiling in Q96. Undefined when the auction imposes none. */
  maxBidPriceQ96: bigint | undefined
  /** The highest price a bid can actually sit at — the ceiling rounded down to the tick grid. */
  maxValidBidQ96: bigint | undefined
  /**
   * The ceiling as an FDV, formatted for copy.
   *
   * The ceiling is a price PER TOKEN, but the max-valuation field is denominated in FDV
   * (BidMaxValuationInputV2 renders ValuationInputType.Fdv), so copy that says "Maximum
   * FDV" has to multiply by the token's whole supply. Showing the raw per-token price
   * there understates the limit by the entire supply — 1e-06 ETH instead of 100 ETH.
   */
  maxBidPriceFdvFormatted: string | undefined
  /**
   * True once no tick remains strictly above the clearing price and at or below the
   * ceiling: the auction is closed to new bids even though it has not ended.
   */
  isMaxBidPriceReached: boolean
}

interface UseAuctionMaxBidPriceParams {
  bidTokenDecimals: number | undefined
  auctionTokenDecimals: number | undefined
  /**
   * The auction's tick grid, from the caller's derivation. Taken as params rather than read
   * from the store again so the grid the ceiling rounds against and the grid the field
   * clamps against cannot drift apart.
   */
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  tickSizeQ96: bigint | undefined
}

/**
 * The auction-wide bid price ceiling imposed by a `maxBidPrice()` validation hook,
 * served by the backend's VerifyWallet response.
 *
 * Independent of KYC: a hook may impose a ceiling on its own or alongside KYC, and the
 * ceiling binds every wallet regardless of its own verification status. It also resolves
 * for logged-out visitors, since the query falls back to the zero address — the ceiling
 * is a property of the auction and must render before anyone connects.
 *
 * Shares useAuctionKycStatus's query cache entry rather than issuing a second lookup, via
 * the shared buildVerifyWalletParams helper.
 */
export function useAuctionMaxBidPrice({
  bidTokenDecimals,
  auctionTokenDecimals,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: UseAuctionMaxBidPriceParams): AuctionMaxBidPrice {
  const { formatNumberOrString } = useLocalizationContext()
  const { auctionAddress, auctionDetails } = useAuctionStore((state) => ({
    auctionAddress: state.auctionAddress,
    auctionDetails: state.auctionDetails,
  }))

  // Shared derivation, so this lands on the same cache entry as useAuctionKycStatus by
  // value and not merely by field shape.
  const { data } = useVerifyWalletQuery(useVerifyWalletParams())

  // Already validated and parsed by getMaxBidPriceQ96 — no BigInt() at render time.
  const servedMaxBidPriceQ96 = useMemo(() => getMaxBidPriceQ96(data?.validations), [data?.validations])

  // The wallet address is part of the query key, so connecting or switching accounts starts
  // a fresh fetch whose data is undefined until it lands. Dropping the ceiling for that round
  // trip would widen the slider past it, re-enable a closed form, and leave the submitted
  // price unclamped — a bid placed in the window reverts with MaxBidPriceExceeded, and
  // connect-then-bid is the normal flow. Retaining it is sound because maxBidPrice() is
  // immutable and a property of the auction, not of the wallet asking.
  const retained = useRef<{ auctionKey: string; q96: bigint | undefined }>({ auctionKey: '', q96: undefined })
  const auctionKey = `${auctionDetails?.chainId ?? ''}:${auctionAddress ?? ''}`
  if (retained.current.auctionKey !== auctionKey) {
    retained.current = { auctionKey, q96: undefined }
  }
  if (servedMaxBidPriceQ96 !== undefined) {
    retained.current.q96 = servedMaxBidPriceQ96
  }
  const maxBidPriceQ96 = servedMaxBidPriceQ96 ?? retained.current.q96

  const maxValidBidQ96 = useMemo(() => {
    if (maxBidPriceQ96 === undefined || floorPriceQ96 === undefined || tickSizeQ96 === undefined) {
      return undefined
    }
    return calculateMaxValidBidQ96({ maxBidPriceQ96, floorPriceQ96, tickSizeQ96 })
  }, [maxBidPriceQ96, floorPriceQ96, tickSizeQ96])

  const maxBidPriceFdvFormatted = useMemo(() => {
    const totalSupplyRaw = auctionDetails?.tokenTotalSupply
    if (maxBidPriceQ96 === undefined || !totalSupplyRaw || bidTokenDecimals === undefined) {
      return undefined
    }
    // FDV = price × the token's WHOLE supply, matching how the slider labels its range.
    const fdvRaw = computeFdvBidTokenRaw({
      priceQ96: maxBidPriceQ96,
      totalSupplyRaw,
      auctionTokenDecimals,
    })
    if (fdvRaw === 0n) {
      return undefined
    }
    return formatNumberOrString({
      value: approximateNumberFromRaw({ raw: fdvRaw, decimals: bidTokenDecimals }),
      type: NumberType.TokenNonTx,
    })
  }, [maxBidPriceQ96, auctionDetails?.tokenTotalSupply, bidTokenDecimals, auctionTokenDecimals, formatNumberOrString])

  const capReached = useMemo(() => {
    if (
      maxBidPriceQ96 === undefined ||
      floorPriceQ96 === undefined ||
      tickSizeQ96 === undefined ||
      clearingPriceQ96 === undefined
    ) {
      // No ceiling, or the state needed to judge one hasn't loaded. Never report
      // "closed" on missing data — that would hide a biddable auction.
      return false
    }
    return isMaxBidPriceReached({ clearingPriceQ96, floorPriceQ96, tickSizeQ96, maxBidPriceQ96 })
  }, [maxBidPriceQ96, floorPriceQ96, tickSizeQ96, clearingPriceQ96])

  return {
    maxBidPriceQ96,
    maxValidBidQ96,
    maxBidPriceFdvFormatted,
    isMaxBidPriceReached: capReached,
  }
}
