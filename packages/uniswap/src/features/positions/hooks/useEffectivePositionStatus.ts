import type { PartialMessage } from '@bufbuild/protobuf'
import { parseUnits } from '@ethersproject/units'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { ListPoolsRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { hasZeroInRangeLiquidity } from 'uniswap/src/features/positions/hasZeroInRangeLiquidity'
import {
  getMarketPriceFromUsdPrices,
  getMarketPriceImpliedTick,
  getPoolPriceDivergence,
  marketPriceToSdkPrice,
  scaleUsdUnitValue,
} from 'uniswap/src/features/positions/poolPriceDivergence'
import {
  getListPoolsAddressPairs,
  getMostLiquidSiblingPoolPrice,
  type ListPoolsAddressPair,
} from 'uniswap/src/features/positions/siblingPoolPrice'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useUSDCValueWithStatus } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'

export interface EffectivePositionStatusInfo {
  /** Status the position would have at the sibling-pool reference price when the pool's own price is out of sync; otherwise the served status. The USD feed alone never overrides the served status. */
  effectiveStatus: PositionStatus
  /** True when the served status disagrees with the effective status because the pool price is out of sync. */
  isPoolPriceStale: boolean
  /** True when the pool's own price can't be trusted: it diverges from (or is too extreme to compare against) the reference price, or the pool has no in-range liquidity and no reference vouches for its price. */
  isPoolOutOfSync: boolean
  /**
   * Replacement price to display instead of the out-of-sync pool price (token0/token1 orientation).
   * Only ever sourced from the most liquid same-pair sibling pool meeting the trusted-TVL floor
   * (MIN_TRUSTED_SIBLING_TVL_USD) — never
   * from the USD feed or a liquidity-only reference, which can be stale or fabricated. Unset when
   * no trustworthy sibling pool exists: warn without substituting.
   */
  marketPrice?: Price<Currency, Currency>
}

// V2 is deliberately excluded: a v2 pool carries no usable sqrtPriceX96 for the price derivation,
// so it could never win the sibling comparison anyway (and the v1 sibling query additionally 504'd
// at the gateway whenever protocolVersions included V2). Pairs whose deepest liquidity is a v2 pool
// fall back to the USD feed's warn-only path.
const SIBLING_POOL_PROTOCOL_VERSIONS = [ProtocolVersion.V3, ProtocolVersion.V4]

/**
 * data.v2 `ListPools` params for one sibling-pair query. Returns undefined when the chain or pair is
 * missing so the query layer stays disabled rather than firing an unfiltered request. The token
 * filter is an unordered AND set (`getListPoolsAddressPairs` already emits each native/wrapped
 * representation as its own pair).
 */
function getSiblingPoolsParams(
  chainId: number | undefined,
  pair: ListPoolsAddressPair | undefined,
): Omit<PartialMessage<ListPoolsRequest>, 'page'> | undefined {
  if (!chainId || !pair) {
    return undefined
  }
  return {
    chainIds: [chainId],
    sort: { orderBy: PoolsOrderBy.TVL },
    filter: {
      protocolVersions: SIBLING_POOL_PROTOCOL_VERSIONS,
      tokenFilter: { tokens: [pair.token0, pair.token1], logicalOperator: PoolTokenLogicalOperator.AND },
      // Parity with the previous data.v1 sibling query: include spam and skip the curated-feed
      // quality gates so long-tail sibling pairs aren't dropped before the trust check runs.
      includeSpam: true,
      applyTopLevelFilters: false,
    },
  }
}

/**
 * A pool's own price can't be trusted when it diverges from the reference market price (or is too
 * extreme to compare against it), or when the pool has no in-range liquidity left to arbitrage it
 * back AND no reference vouches for its price. A usable reference comparison decides in both
 * directions: an agreeing reference clears the zero-liquidity signal, since a drained pool whose
 * price the reference confirms is still correctly priced.
 */
export function isPoolPriceOutOfSync({
  pool,
  marketPrice,
}: {
  pool?: V3Pool | V4Pool
  marketPrice?: Fraction
}): boolean {
  if (!pool) {
    return false
  }

  const divergence = marketPrice ? getPoolPriceDivergence({ poolPrice: pool.token0Price, marketPrice }) : undefined
  if (divergence) {
    return divergence.isOutOfSync
  }

  // No reference verdict: with no in-range liquidity nothing can arbitrage the price back, so the
  // pool's own price is untrusted on its own.
  return hasZeroInRangeLiquidity(pool)
}

/**
 * The served position status derives from the pool's own tick, which can be stale when the pool
 * is out of sync. Returns the status implied by the reference market price when — and only when —
 * the pool is out of sync (`isPoolOutOfSync`, computed once by the caller via
 * {@link isPoolPriceOutOfSync} so the badge and the status override share one source of truth);
 * otherwise returns the served status untouched.
 */
export function getEffectivePositionStatus({
  status,
  pool,
  tickLower,
  tickUpper,
  marketPrice,
  isPoolOutOfSync,
}: {
  status: PositionStatus
  pool?: V3Pool | V4Pool
  tickLower?: number
  tickUpper?: number
  marketPrice?: Fraction
  isPoolOutOfSync: boolean
}): PositionStatus {
  const applicable = status === PositionStatus.IN_RANGE || status === PositionStatus.OUT_OF_RANGE
  if (!applicable || !pool || tickLower === undefined || tickUpper === undefined || !marketPrice) {
    return status
  }

  if (!isPoolOutOfSync) {
    return status
  }

  const impliedTick = getMarketPriceImpliedTick({ pool, marketPrice })
  if (impliedTick === undefined) {
    return status
  }

  return impliedTick >= tickLower && impliedTick < tickUpper ? PositionStatus.IN_RANGE : PositionStatus.OUT_OF_RANGE
}

/**
 * Combines the served status with the available reference prices.
 * - The warning icon (isPoolOutOfSync): only a TRUSTED sibling reference (USD TVL at or above
 *   MIN_TRUSTED_SIBLING_TVL_USD) decides in both directions — its agreement clears even the
 *   zero-liquidity signal. Without one, a pool with zero in-range liquidity always warns (nothing
 *   trustworthy vouches for its pinned price), and the USD feed or an untrusted sibling may only
 *   RAISE the verdict on divergence, never clear it.
 * - The status override and the substituted display price both require a trusted sibling-pool
 *   reference. Untrusted references — the USD feed, or a below-floor sibling, both cheap to be
 *   wrong or made wrong for long-tail pairs — never flip the badge or replace the displayed
 *   price; they only ever raise the warning icon.
 */
export function getEffectivePositionStatusInfo({
  status,
  pool,
  tickLower,
  tickUpper,
  feedMarketPrice,
  siblingPoolPrice,
  isSiblingPriceTrusted,
  isSiblingPricePending = false,
}: {
  status: PositionStatus
  pool: V3Pool | V4Pool
  tickLower?: number
  tickUpper?: number
  feedMarketPrice?: Fraction
  siblingPoolPrice?: Fraction
  /** Required with no default: the trust gate must be an explicit caller decision, never open by omission. */
  isSiblingPriceTrusted: boolean
  isSiblingPricePending?: boolean
}): EffectivePositionStatusInfo {
  // Don't flash a warning off the first-pass feed signal while the sibling-pool reference is in flight
  if (isSiblingPricePending) {
    return { effectiveStatus: status, isPoolPriceStale: false, isPoolOutOfSync: false, marketPrice: undefined }
  }

  // Same trust bar as the substitution: only a trusted sibling reference may override the served status
  const trustedSiblingPrice = isSiblingPriceTrusted ? siblingPoolPrice : undefined
  const untrustedSiblingPrice = isSiblingPriceTrusted ? undefined : siblingPoolPrice
  // A trusted sibling decides in both directions (its agreement clears even the zero-liquidity
  // signal). Without one, a drained pool always warns — an agreeing feed or untrusted sibling
  // cannot vouch for a pinned price, only raise the verdict on divergence
  const isPoolOutOfSync = trustedSiblingPrice
    ? isPoolPriceOutOfSync({ pool, marketPrice: trustedSiblingPrice })
    : hasZeroInRangeLiquidity(pool) ||
      isPoolPriceOutOfSync({ pool, marketPrice: feedMarketPrice }) ||
      (untrustedSiblingPrice !== undefined && isPoolPriceOutOfSync({ pool, marketPrice: untrustedSiblingPrice }))
  const effectiveStatus = trustedSiblingPrice
    ? getEffectivePositionStatus({
        status,
        pool,
        tickLower,
        tickUpper,
        marketPrice: trustedSiblingPrice,
        isPoolOutOfSync,
      })
    : status

  return {
    effectiveStatus,
    isPoolPriceStale: effectiveStatus !== status,
    isPoolOutOfSync,
    marketPrice:
      isPoolOutOfSync && trustedSiblingPrice
        ? marketPriceToSdkPrice({ pool, marketPrice: trustedSiblingPrice })
        : undefined,
  }
}

function unitAmount(currency?: Currency): CurrencyAmount<Currency> | undefined {
  return currency
    ? CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(parseUnits('1', currency.decimals).toString()))
    : undefined
}

function useSiblingPoolPrice({
  pool,
  chainId,
  ownPoolId,
  enabled,
}: {
  pool?: V3Pool | V4Pool
  chainId?: number
  ownPoolId?: string
  enabled: boolean
}): { siblingPoolPrice?: Fraction; isSiblingPriceTrusted: boolean; isSiblingPricePending: boolean } {
  const addressPairs = pool ? getListPoolsAddressPairs({ token0: pool.token0, token1: pool.token1 }) : []
  const [primaryPair, alternatePair] = addressPairs
  const primaryPools = useInfiniteQuery(
    getListPoolsInfiniteQueryOptions({
      params: getSiblingPoolsParams(chainId, primaryPair),
      enabled: enabled && primaryPair !== undefined,
    }),
  )
  const alternatePools = useInfiniteQuery(
    getListPoolsInfiniteQueryOptions({
      params: getSiblingPoolsParams(chainId, alternatePair),
      enabled: enabled && alternatePair !== undefined,
    }),
  )

  // Pending until each enabled query settles. Not isLoading: on the render where `enabled` flips
  // false→true the query is still fetchStatus 'idle' (isLoading false, data undefined), which would
  // fall through to the feed for one render and flash the warning this guard exists to suppress.
  // A failed fetch settles via isError, so this never hangs on errors.
  const isSiblingPricePending =
    enabled &&
    ((primaryPair !== undefined && !primaryPools.isSuccess && !primaryPools.isError) ||
      (alternatePair !== undefined && !alternatePools.isSuccess && !alternatePools.isError))

  const primaryPoolsData = primaryPools.data
  const alternatePoolsData = alternatePools.data
  const sibling = useMemo(() => {
    if (!pool || ownPoolId === undefined) {
      return undefined
    }

    return getMostLiquidSiblingPoolPrice({
      pools: [
        ...(primaryPoolsData?.pages.flatMap((page) => page.pools) ?? []),
        ...(alternatePoolsData?.pages.flatMap((page) => page.pools) ?? []),
      ],
      ownPoolId,
      token0: pool.token0,
      token1: pool.token1,
    })
  }, [pool, ownPoolId, primaryPoolsData, alternatePoolsData])

  return {
    siblingPoolPrice: sibling?.price,
    // A reference below the trusted-TVL floor is detection-only (see SiblingPoolPrice.hasTrustedTvl)
    isSiblingPriceTrusted: sibling?.hasTrustedTvl ?? false,
    isSiblingPricePending,
  }
}

export function useEffectivePositionStatus(positionInfo: PositionInfo | undefined): EffectivePositionStatusInfo {
  const applicable =
    positionInfo !== undefined &&
    positionInfo.version !== ProtocolVersion.V2 &&
    (positionInfo.status === PositionStatus.IN_RANGE || positionInfo.status === PositionStatus.OUT_OF_RANGE) &&
    positionInfo.poolOrPair !== undefined

  const pool = applicable ? positionInfo.poolOrPair : undefined
  // Undefined currencies skip the underlying price fetches for positions this check can't apply to
  const { value: token0UsdValue, isLoading: token0UsdLoading } = useUSDCValueWithStatus(
    unitAmount(pool?.token0),
    PollingInterval.Slow,
  )
  const { value: token1UsdValue, isLoading: token1UsdLoading } = useUSDCValueWithStatus(
    unitAmount(pool?.token1),
    PollingInterval.Slow,
  )

  const feedMarketPrice = getMarketPriceFromUsdPrices({
    baseUsdScaled: token0UsdValue ? scaleUsdUnitValue(token0UsdValue) : undefined,
    quoteUsdScaled: token1UsdValue ? scaleUsdUnitValue(token1UsdValue) : undefined,
  })

  // The feed settling without a usable price means the first-pass check can never run for this
  // pair, so the sibling reference is the only possible coverage — fetch it. While the feed is
  // still loading, stay lazy: priced pairs keep costing zero extra requests when healthy.
  const feedSettledWithoutPrice = feedMarketPrice === undefined && !token0UsdLoading && !token1UsdLoading

  // First-pass signal from data already on hand; the sibling-pool queries only run when it fires,
  // when no feed price will ever exist to run it with, or when the pool is drained — only a
  // trusted sibling can vouch for a pinned price, so an agreeing feed must not skip the fetch
  const fetchSiblingPools =
    pool !== undefined &&
    (feedSettledWithoutPrice ||
      hasZeroInRangeLiquidity(pool) ||
      isPoolPriceOutOfSync({ pool, marketPrice: feedMarketPrice }))

  const { siblingPoolPrice, isSiblingPriceTrusted, isSiblingPricePending } = useSiblingPoolPrice({
    pool,
    chainId: positionInfo?.chainId,
    ownPoolId: positionInfo?.poolId,
    enabled: fetchSiblingPools,
  })

  const servedStatus = positionInfo?.status ?? PositionStatus.UNSPECIFIED
  if (!applicable || !pool) {
    return { effectiveStatus: servedStatus, isPoolPriceStale: false, isPoolOutOfSync: false, marketPrice: undefined }
  }

  return getEffectivePositionStatusInfo({
    status: servedStatus,
    pool,
    tickLower: positionInfo.tickLower,
    tickUpper: positionInfo.tickUpper,
    feedMarketPrice,
    siblingPoolPrice,
    isSiblingPriceTrusted,
    isSiblingPricePending,
  })
}
