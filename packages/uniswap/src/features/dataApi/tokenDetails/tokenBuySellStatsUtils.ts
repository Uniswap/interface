import { type PlainMessage } from '@bufbuild/protobuf'
import type { TokenBuySellStats as RestTokenBuySellStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { parseFiniteNumber } from 'utilities/src/primitives/number'

export interface TokenBuySellSide {
  count: number
  /** Undefined when the side had swaps but none of them had a credible USD price. */
  volumeUsd: number | undefined
  /** Whole tokens. EVM only: the backend's Solana leg reports no token volume. */
  tokenAmount: number
  uniqueWallets: number
}

export interface TokenBuySellStatsData {
  buys: TokenBuySellSide
  sells: TokenBuySellSide
  /** Undefined in token-units mode. */
  totalVolumeUsd: number | undefined
  totalTokenAmount: number
  /** A side has swaps but no USD volume, so volume renders in token units instead of USD. */
  isTokenUnits: boolean
}

function isMissingUsdVolume(side: TokenBuySellSide): boolean {
  return side.count > 0 && side.volumeUsd === undefined
}

function isMissingTokenAmount(side: TokenBuySellSide): boolean {
  return side.count > 0 && side.tokenAmount === 0
}

/**
 * Undefined when the window's volume can't be shown in either unit: a side needs token units but a
 * side that traded reports no token amount (the Solana leg never does).
 */
export function mapTokenBuySellStats(stats: PlainMessage<RestTokenBuySellStats>): TokenBuySellStatsData | undefined {
  const buys: TokenBuySellSide = {
    count: stats.buyCount,
    volumeUsd: stats.buyVolumeUsd,
    tokenAmount: parseFiniteNumber(stats.buyVolumeTokenAmount) ?? 0,
    uniqueWallets: stats.uniqueBuyers,
  }
  const sells: TokenBuySellSide = {
    count: stats.sellCount,
    volumeUsd: stats.sellVolumeUsd,
    tokenAmount: parseFiniteNumber(stats.sellVolumeTokenAmount) ?? 0,
    uniqueWallets: stats.uniqueSellers,
  }
  // One side in USD and the other in tokens can't share a split bar, so either gap switches both.
  const isTokenUnits = isMissingUsdVolume(buys) || isMissingUsdVolume(sells)
  if (isTokenUnits && (isMissingTokenAmount(buys) || isMissingTokenAmount(sells))) {
    return undefined
  }
  return {
    buys,
    sells,
    totalVolumeUsd: isTokenUnits ? undefined : (buys.volumeUsd ?? 0) + (sells.volumeUsd ?? 0),
    totalTokenAmount: buys.tokenAmount + sells.tokenAmount,
    isTokenUnits,
  }
}
