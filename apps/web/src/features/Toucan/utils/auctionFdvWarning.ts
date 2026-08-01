import { AuctionFdvWarningConfigKey, DynamicConfigs, useDynamicConfigValue } from '@universe/gating'
import { useMemo } from 'react'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { approximateNumberFromRaw, formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'

// Formats an auction's total committed volume in USD when available, otherwise in the currency token.
export function getAuctionCommittedVolumeDisplay(
  auction: EnrichedAuction['auction'],
  convertFiatAmountFormatted: (fromAmount: Maybe<number | string>, numberType: FiatNumberType) => string,
): string | undefined {
  const committedVolumeUsd = auction?.totalBidVolumeUsd !== undefined ? Number(auction.totalBidVolumeUsd) : undefined
  if (committedVolumeUsd !== undefined) {
    return convertFiatAmountFormatted(committedVolumeUsd, NumberType.FiatTokenStats)
  }
  const raw = auction?.totalBidVolume
  return raw && auction.currencyTokenDecimals !== undefined
    ? formatCompactFromRaw({ raw: BigInt(raw), decimals: auction.currencyTokenDecimals })
    : undefined
}

// Formats the committed volume an auction must reach to launch (its requiredCurrencyRaised), in USD
// when a currency price is available, otherwise in the currency token. Undefined when no requirement.
export function getAuctionCancelThresholdDisplay(
  auction: EnrichedAuction['auction'],
  convertFiatAmountFormatted: (fromAmount: Maybe<number | string>, numberType: FiatNumberType) => string,
): string | undefined {
  const requiredRaw = auction?.requiredCurrencyRaised
  const decimals = auction?.currencyTokenDecimals
  if (!requiredRaw || decimals === undefined) {
    return undefined
  }
  const required = BigInt(requiredRaw)
  if (required <= 0n) {
    return undefined
  }
  const currencyPriceUsd = auction.currencyPriceUsd !== undefined ? Number(auction.currencyPriceUsd) : undefined
  if (currencyPriceUsd !== undefined && currencyPriceUsd > 0) {
    return convertFiatAmountFormatted(
      approximateNumberFromRaw({ raw: required, decimals }) * currencyPriceUsd,
      NumberType.FiatTokenStats,
    )
  }
  const formatted = formatCompactFromRaw({ raw: required, decimals, maxFractionDigits: 2 })
  return auction.currencyTokenSymbol ? `${formatted} ${auction.currencyTokenSymbol}` : formatted
}

// Percent of the launch threshold met by committed volume, capped at 100. Undefined when no threshold.
export function getAuctionThresholdPercentMet(auction: EnrichedAuction['auction']): number | undefined {
  const requiredRaw = auction?.requiredCurrencyRaised
  const totalRaw = auction?.totalBidVolume
  if (!requiredRaw) {
    return undefined
  }
  const required = Number(requiredRaw)
  if (!Number.isFinite(required) || required <= 0) {
    return undefined
  }
  const total = totalRaw ? Number(totalRaw) : 0
  if (!Number.isFinite(total)) {
    return undefined
  }
  return Math.min(100, Math.max(0, (total / required) * 100))
}

export const DEFAULT_AUCTION_FDV_WARNING_THRESHOLDS: AuctionFdvWarningThresholds = {
  committedVolumeUsd: 20_000,
  bidCount: 50,
  fdvUsd: 20_000_000,
}

export interface AuctionFdvWarningThresholds {
  committedVolumeUsd: number
  bidCount: number
  fdvUsd: number
}

export function useAuctionFdvWarningThresholds(): AuctionFdvWarningThresholds {
  const committedVolumeUsd = useDynamicConfigValue({
    config: DynamicConfigs.AuctionFdvWarning,
    key: AuctionFdvWarningConfigKey.CommittedVolumeUsdThreshold,
    defaultValue: DEFAULT_AUCTION_FDV_WARNING_THRESHOLDS.committedVolumeUsd,
  })
  const bidCount = useDynamicConfigValue({
    config: DynamicConfigs.AuctionFdvWarning,
    key: AuctionFdvWarningConfigKey.BidCountThreshold,
    defaultValue: DEFAULT_AUCTION_FDV_WARNING_THRESHOLDS.bidCount,
  })
  const fdvUsd = useDynamicConfigValue({
    config: DynamicConfigs.AuctionFdvWarning,
    key: AuctionFdvWarningConfigKey.FdvUsdThreshold,
    defaultValue: DEFAULT_AUCTION_FDV_WARNING_THRESHOLDS.fdvUsd,
  })
  return useMemo(() => ({ committedVolumeUsd, bidCount, fdvUsd }), [committedVolumeUsd, bidCount, fdvUsd])
}

// An auction reads as low-engagement-but-high-FDV when it has thin demand (low committed volume or
// few bids) paired with an outsized valuation. bidCount is optional: surfaces without per-auction bid
// data (e.g. the explore table) pass undefined, making this effectively volume-only until that data exists.
export function isLowEngagementHighFdvAuction(
  {
    committedVolumeUsd,
    bidCount,
    fdvUsd,
  }: {
    committedVolumeUsd: number | undefined
    bidCount: number | undefined
    fdvUsd: number | undefined
  },
  thresholds: AuctionFdvWarningThresholds,
): boolean {
  if (fdvUsd === undefined || fdvUsd <= thresholds.fdvUsd) {
    return false
  }
  const lowVolume = committedVolumeUsd !== undefined && committedVolumeUsd < thresholds.committedVolumeUsd
  const lowBids = bidCount !== undefined && bidCount < thresholds.bidCount
  return lowVolume || lowBids
}
