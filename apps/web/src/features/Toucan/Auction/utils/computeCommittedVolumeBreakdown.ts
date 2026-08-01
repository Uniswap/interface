import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { BidDistributionData, BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import {
  approximateNumberFromRaw,
  formatCompactFromRaw,
  formatTokenAmountWithSymbol,
} from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

export interface CommittedVolumeBreakdown {
  filledRaw: bigint
  inRangeOutstandingRaw: bigint
  outOfRangeRaw: bigint
  totalRaw: bigint
  // Filled + in-range outstanding: committed capital excluding cancelled / out-of-range bids.
  committedRaw: bigint
  requiredRaw: bigint | null

  filledFormatted: string
  inRangeOutstandingFormatted: string
  outOfRangeFormatted: string
  totalFormatted: string
  committedFormatted: string
  requiredFormatted: string | null

  filledFiatFormatted: string | null
  inRangeOutstandingFiatFormatted: string | null
  outOfRangeFiatFormatted: string | null
  totalFiatFormatted: string | null
  committedFiatFormatted: string | null
  requiredFiatFormatted: string | null
}

interface ComputeCommittedVolumeBreakdownParams {
  bidDistributionData: BidDistributionData | null
  clearingPriceQ96: string | undefined
  filledRaw: string | undefined
  totalRaw: string | undefined
  requiredRaw: string | undefined
  bidTokenInfo: BidTokenInfo | undefined
  bidTokenMarketPriceUsd: number | undefined
  convertFiatAmountFormatted: (fromAmount: Maybe<number | string>, numberType: FiatNumberType) => string
}

export function computeCommittedVolumeBreakdown({
  bidDistributionData,
  clearingPriceQ96,
  filledRaw,
  totalRaw,
  requiredRaw,
  bidTokenInfo,
  bidTokenMarketPriceUsd,
  convertFiatAmountFormatted,
}: ComputeCommittedVolumeBreakdownParams): CommittedVolumeBreakdown | null {
  if (!bidTokenInfo || !totalRaw) {
    return null
  }

  const total = safeBigInt(totalRaw) ?? 0n
  const clearing = clearingPriceQ96 ? (safeBigInt(clearingPriceQ96) ?? 0n) : 0n

  let outOfRange = 0n
  if (bidDistributionData) {
    for (const [tickQ96, volume] of bidDistributionData) {
      const tick = safeBigInt(tickQ96)
      const vol = safeBigInt(volume)
      if (tick !== null && vol !== null && tick < clearing) {
        outOfRange += vol
      }
    }
  }
  if (outOfRange > total) {
    outOfRange = total
  }

  const filledCap = total - outOfRange
  const filledValue = safeBigInt(filledRaw) ?? 0n
  const filled = filledValue < 0n ? 0n : filledValue > filledCap ? filledCap : filledValue
  const inRangeOutstanding = total - outOfRange - filled
  const committed = filled + inRangeOutstanding
  const required = safeBigInt(requiredRaw)

  const toToken = (raw: bigint): string =>
    formatTokenAmountWithSymbol({
      raw,
      decimals: bidTokenInfo.decimals,
      symbol: bidTokenInfo.symbol,
      isStablecoin: bidTokenInfo.isStablecoin,
    })

  const toFiat = (raw: bigint): string | null => {
    if (!bidTokenMarketPriceUsd) {
      return null
    }
    const approx = approximateNumberFromRaw({ raw, decimals: bidTokenInfo.decimals, significantDigits: 15 })
    return convertFiatAmountFormatted(approx * bidTokenMarketPriceUsd, NumberType.FiatTokenStats)
  }

  const requiredFormatted =
    required === null
      ? null
      : `${formatCompactFromRaw({ raw: required, decimals: bidTokenInfo.decimals, maxFractionDigits: 2 })} ${bidTokenInfo.symbol}`

  return {
    filledRaw: filled,
    inRangeOutstandingRaw: inRangeOutstanding,
    outOfRangeRaw: outOfRange,
    totalRaw: total,
    committedRaw: committed,
    requiredRaw: required,

    filledFormatted: toToken(filled),
    inRangeOutstandingFormatted: toToken(inRangeOutstanding),
    outOfRangeFormatted: toToken(outOfRange),
    totalFormatted: toToken(total),
    committedFormatted: toToken(committed),
    requiredFormatted,

    filledFiatFormatted: toFiat(filled),
    inRangeOutstandingFiatFormatted: toFiat(inRangeOutstanding),
    outOfRangeFiatFormatted: toFiat(outOfRange),
    totalFiatFormatted: toFiat(total),
    committedFiatFormatted: toFiat(committed),
    requiredFiatFormatted: required === null ? null : toFiat(required),
  }
}
