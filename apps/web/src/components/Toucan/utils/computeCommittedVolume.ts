import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { approximateNumberFromRaw, formatTokenAmountWithSymbol } from '~/components/Toucan/Auction/utils/fixedPointFdv'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'

export interface CommittedVolumeTableValue {
  raw: bigint
  usd?: number
  formattedBidToken: string
}

/**
 * Computes all committed volume values for table display.
 * Uses fixed decimals with trailing zeros: 3 for abbreviated (K/M/B/T), 2 for stablecoins, 5 for others.
 */
export function computeCommittedVolumeTableValue({
  auction,
  bidTokenCurrencyInfo,
  bidTokenMarketPriceUsd,
  isStablecoin = false,
}: {
  auction: AuctionWithCurrencyInfo
  bidTokenCurrencyInfo: Maybe<CurrencyInfo>
  bidTokenMarketPriceUsd: number | undefined
  isStablecoin?: boolean
}): CommittedVolumeTableValue {
  const fallback: CommittedVolumeTableValue = {
    raw: 0n,
    usd: undefined,
    formattedBidToken: '—',
  }

  try {
    const totalBidVolume = auction.auction?.totalBidVolume ?? auction.totalBidVolume

    if (!totalBidVolume || !bidTokenCurrencyInfo) {
      return fallback
    }

    const raw = BigInt(totalBidVolume)
    const decimals = bidTokenCurrencyInfo.currency.decimals

    // Convert to USD
    const usd = bidTokenMarketPriceUsd
      ? approximateNumberFromRaw({ raw, decimals }) * bidTokenMarketPriceUsd
      : undefined

    const formattedBidToken = formatTokenAmountWithSymbol({
      raw,
      decimals,
      symbol: bidTokenCurrencyInfo.currency.symbol ?? '',
      isStablecoin,
    })

    return {
      raw,
      usd,
      formattedBidToken,
    }
  } catch (_error) {
    return fallback
  }
}
