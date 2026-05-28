import { GetWalletTokensProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
import type { PortfolioChainBalance } from 'uniswap/src/features/dataApi/types'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

/** Align PnL API addresses with {@link currencyAddress}-based keys (native → canonical zero addr). */
function normalizeAddressForPnlLookupKey(address: string): string {
  const lower = address.startsWith('0x') ? address.toLowerCase() : address
  if (lower === DEFAULT_NATIVE_ADDRESS || lower === DEFAULT_NATIVE_ADDRESS_LEGACY) {
    return DEFAULT_NATIVE_ADDRESS
  }
  return lower
}

export type TokenPnlSnapshot = {
  avgCost: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
}

/** Per-chain / API leg key (aligned with {@link normalizeAddressForPnlLookupKey}). */
export function pnlLookupKeyFromPortfolioChainBalance(t: PortfolioChainBalance): string {
  const rawAddr = currencyAddress(t.currencyInfo.currency).toLowerCase()
  const addr = t.currencyInfo.currency.isNative ? DEFAULT_NATIVE_ADDRESS : rawAddr
  return `${normalizeAddressForPnlLookupKey(addr)}-${t.chainId}`
}

function pnlLookupKeyFromChainBreakdown(chain: { tokenAddress: string; chainId: number }): string {
  return `${normalizeAddressForPnlLookupKey(chain.tokenAddress)}-${chain.chainId}`
}

/**
 * One-time index: each API `chainBreakdown` leg (and fallback `aggregated.token`) maps to that group's
 * `aggregated` snapshot so parent rows resolve in O(legs) Map lookups instead of scanning all groups per row.
 * Values are always the multichain aggregate, not per-leg PnL.
 */
function registerAggregatedJoinIndexForGroup(
  group: GetWalletTokensProfitLossResponse['multichainTokenProfitLoss'][number],
  joinIndex: Map<string, TokenPnlSnapshot>,
): void {
  const aggregated = group.aggregated
  if (!aggregated) {
    return
  }
  const snapshot: TokenPnlSnapshot = {
    avgCost: aggregated.averageCostUsd,
    unrealizedPnl: aggregated.unrealizedReturnUsd,
    unrealizedPnlPercent: aggregated.unrealizedReturnPercent,
  }
  if (group.chainBreakdown.length > 0) {
    for (const chain of group.chainBreakdown) {
      joinIndex.set(pnlLookupKeyFromChainBreakdown(chain), snapshot)
    }
    return
  }
  if (!aggregated.token) {
    return
  }
  joinIndex.set(
    pnlLookupKeyFromChainBreakdown({
      tokenAddress: aggregated.token.address,
      chainId: aggregated.token.chainId,
    }),
    snapshot,
  )
}

export function buildPnlLookupsFromProfitLoss(tokenProfitLossData: GetWalletTokensProfitLossResponse | undefined): {
  perChainPnlLookup: Map<string, TokenPnlSnapshot>
  aggregatedJoinByLegKey: Map<string, TokenPnlSnapshot>
} {
  const perChainPnlLookup = new Map<string, TokenPnlSnapshot>()
  const aggregatedJoinByLegKey = new Map<string, TokenPnlSnapshot>()
  if (!tokenProfitLossData) {
    return { perChainPnlLookup, aggregatedJoinByLegKey }
  }

  for (const entry of tokenProfitLossData.tokenProfitLosses) {
    if (!entry.token) {
      continue
    }
    const key = pnlLookupKeyFromChainBreakdown({
      tokenAddress: entry.token.address,
      chainId: entry.token.chainId,
    })
    perChainPnlLookup.set(key, {
      avgCost: entry.averageCostUsd,
      unrealizedPnl: entry.unrealizedReturnUsd,
      unrealizedPnlPercent: entry.unrealizedReturnPercent,
    })
  }

  for (const group of tokenProfitLossData.multichainTokenProfitLoss) {
    registerAggregatedJoinIndexForGroup(group, aggregatedJoinByLegKey)
    for (const chain of group.chainBreakdown) {
      const key = pnlLookupKeyFromChainBreakdown(chain)
      perChainPnlLookup.set(key, {
        avgCost: chain.averageCostUsd,
        unrealizedPnl: chain.unrealizedReturnUsd,
        unrealizedPnlPercent: chain.unrealizedReturnPercent,
      })
    }
  }

  return { perChainPnlLookup, aggregatedJoinByLegKey }
}

/** First portfolio leg that appears in {@link aggregatedJoinByLegKey} wins (same snapshot for every leg in a group). */
export function resolveAggregatedPnlForChainTokens(
  chainTokensForRow: PortfolioChainBalance[],
  aggregatedJoinByLegKey: Map<string, TokenPnlSnapshot>,
): TokenPnlSnapshot | undefined {
  for (const t of chainTokensForRow) {
    const hit = aggregatedJoinByLegKey.get(pnlLookupKeyFromPortfolioChainBalance(t))
    if (hit) {
      return hit
    }
  }
  return undefined
}
