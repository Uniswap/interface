import { useInfiniteQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Percent } from '@uniswap/sdk-core'
import { Platform, getValidAddress } from '@universe/chains'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { usePoolLookupTokenAddresses } from '~/features/Liquidity/hooks/usePoolLookupTokenAddresses'
import { useV4PoolsInitializedOnChain } from '~/features/Liquidity/hooks/useV4PoolsInitializedOnChain'
import {
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  getFeeTierKey,
  MAX_FEE_TIER_DECIMALS,
  mergeFeeTiers,
  toNewPoolFeeData,
} from '~/features/Liquidity/utils/feeTiers'
import { getPairListPoolsParams } from '~/features/Liquidity/utils/getPairListPoolsParams'
import { normalizeHookForMatch } from '~/features/Liquidity/utils/normalizeHookForMatch'
import { normalizeRankedPool } from '~/features/Liquidity/utils/normalizeRankedPool'
import { NEW_TOKEN_PLACEHOLDER_ADDRESS } from '~/pages/Liquidity/CreateAuction/types'
import { FeeTierData } from '~/types/liquidity'

// One TVL-sorted page covers a pair's fee-tier distribution in practice; see the pair-filter
// exhaustiveness question tracked against the endpoint for the pathological case.
const LIST_POOLS_PAGE_SIZE = 100

/**
 * @returns map of fee tier (in hundredths of bips) to more data about the Pool
 *
 */
export function useAllFeeTierPoolData({
  chainId,
  protocolVersion,
  sdkCurrencies,
  withDynamicFeeTier = false,
  hook,
  checkOnChainPoolExistence = false,
  additionalFeeTiersToCheck,
  skip = false,
}: {
  chainId?: number
  protocolVersion: ProtocolVersion
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
  hook: string
  withDynamicFeeTier?: boolean
  /**
   * Leaves the pair's pools unfetched, so the result holds only the (uncreated) default tiers. The
   * adapter-address lookup still runs: it takes no enabled flag, and is a cached query the create flow
   * already issues for the same pair.
   */
  skip?: boolean
  /**
   * When true, additionally verifies pool existence on-chain (`StateView.getSlot0`) for the default
   * tiers and any `additionalFeeTiersToCheck`, marking initialized pools as `created`. Required by flows
   * that must reject any existing pool (e.g. CCA auctions), since the indexed `listPools` data omits
   * abandoned/zero-liquidity pools the contract still blocks.
   */
  checkOnChainPoolExistence?: boolean
  /** Extra (non-default) fee tiers to include in the on-chain existence check, e.g. a user-entered custom tier. */
  additionalFeeTiersToCheck?: FeeData[]
}): { feeTierData: Record<string, FeeTierData>; hasExistingFeeTiers: boolean; isLoading: boolean; isError: boolean } {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const isPlaceholderToken = (c: Maybe<Currency>) => c?.isToken && c.address === NEW_TOKEN_PLACEHOLDER_ADDRESS
  const shouldFetchPools =
    !skip &&
    Boolean(chainId && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) &&
    !isPlaceholderToken(sdkCurrencies.TOKEN0) &&
    !isPlaceholderToken(sdkCurrencies.TOKEN1)

  // Permissioned pools are indexed under the PA adapter, not the displayed sec-token;
  // an unmapped lookup misses them and every fee tier falsely reads as available.
  const {
    lookupAddress0,
    lookupAddress1,
    isLoading: isLookupAddressLoading,
  } = usePoolLookupTokenAddresses({ token0: sdkCurrencies.TOKEN0, token1: sdkCurrencies.TOKEN1 })

  const listPoolsParams = useMemo(() => {
    const params = getPairListPoolsParams({
      chainId,
      addresses: [lookupAddress0, lookupAddress1],
      protocolVersions: [protocolVersion],
    })
    // Server-side hook filter (client-data-api 0.0.188): V4 only — the filter never matches
    // V2/V3 pools. The zero address selects hookless V4 pools, matching data.v1's
    // `hooks ?? ZERO_ADDRESS` semantics.
    if (!params || protocolVersion !== ProtocolVersion.V4) {
      return params
    }
    return {
      ...params,
      filter: {
        ...params.filter,
        hooks: hook
          ? (getValidAddress({ address: hook, withEVMChecksum: true, platform: Platform.EVM }) ?? hook)
          : ZERO_ADDRESS,
      },
    }
  }, [chainId, lookupAddress0, lookupAddress1, protocolVersion, hook])

  const {
    data: v2Data,
    isLoading: isV2PoolsLoading,
    isError: isV2PoolsError,
  } = useInfiniteQuery(
    getListPoolsInfiniteQueryOptions({
      params: listPoolsParams,
      pageSize: LIST_POOLS_PAGE_SIZE,
      enabled: shouldFetchPools && !!lookupAddress0 && !!lookupAddress1,
    }),
  )

  const defaultFeeData = useMemo(
    () =>
      Object.values(
        getDefaultFeeTiersForChainWithDynamicFeeTier({
          chainId,
          dynamicFeeTierEnabled: withDynamicFeeTier,
          protocolVersion,
        }),
      ),
    [chainId, withDynamicFeeTier, protocolVersion],
  )

  // Candidates for the on-chain existence check: the default tiers plus any caller-supplied custom tiers.
  // The check gates flows that create a NEW pool through the launcher, which initializes it at the SDK's
  // fee-derived spacing — so each default tier (v3-table spacing) is re-keyed to the pool id the backend
  // will actually create. Caller-supplied tiers already carry a new-pool spacing.
  const onChainFeeTierCandidates = useMemo(
    () => [...defaultFeeData.map(toNewPoolFeeData), ...(additionalFeeTiersToCheck ?? [])],
    [defaultFeeData, additionalFeeTiersToCheck],
  )

  const {
    unavailableFeeTierKeys,
    isLoading: isOnChainExistenceLoading,
    isError: isOnChainExistenceError,
  } = useV4PoolsInitializedOnChain({
    chainId,
    sdkCurrencies,
    hook,
    feeTiers: onChainFeeTierCandidates,
    enabled: checkOnChainPoolExistence && protocolVersion === ProtocolVersion.V4 && shouldFetchPools,
  })

  // The canonical v2 Pool shape from the data.v2 ListPools response.
  const pools = useMemo(() => {
    const rankedPools = v2Data?.pages.flatMap((page) => page.pools)
    // The server-side hooks filter only matches V4 pools; re-check client-side so V2/V3 (no
    // server-side hook filtering at all) still narrow correctly. A no-op re-check for V4.
    const requestedHook = normalizeHookForMatch(hook)
    return rankedPools
      ?.flatMap((rankedPool) => normalizeRankedPool(rankedPool) ?? [])
      .filter((pool) => normalizeHookForMatch(pool.hookAddress) === requestedHook)
  }, [v2Data, hook])

  const mergedResult = useMemo(() => {
    // Pools missing feeTier/tickSpacing can't key into a tier, so they're excluded from the TVL
    // denominator too — counting them would make the remaining tiers' percentages under-sum once
    // a source omits either field (data.v2 omits tickSpacing for protocol-V2 pairs).
    const tierPools = pools?.flatMap((pool) => {
      const { feeTier, tickSpacing } = pool
      return feeTier !== undefined && tickSpacing !== undefined ? [{ ...pool, feeTier, tickSpacing }] : []
    })
    const liquiditySum = tierPools?.reduce((sum, pool) => BigInt(Math.trunc(pool.tvl)) + sum, 0n)

    const feeTierData: Record<string, FeeTierData> = {}
    if (tierPools && liquiditySum !== undefined && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) {
      for (const pool of tierPools) {
        const { feeTier, tickSpacing, isDynamicFee } = pool
        const key = getFeeTierKey({ feeTier, tickSpacing })
        const totalLiquidityUsdTruncated = Math.trunc(pool.tvl)
        const percentage =
          liquiditySum === 0n ? new Percent(0, 100) : new Percent(totalLiquidityUsdTruncated, liquiditySum.toString())
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        if (feeTierData[key]) {
          feeTierData[key].totalLiquidityUsd += totalLiquidityUsdTruncated
          feeTierData[key].percentage = feeTierData[key].percentage.add(percentage)
        } else {
          feeTierData[key] = {
            id: pool.poolId,
            fee: {
              isDynamic: isDynamicFee,
              feeAmount: feeTier,
              tickSpacing,
            },
            formattedFee: isDynamicFee ? t('fee.dynamic') : formatPercent(feeTier / BIPS_BASE, MAX_FEE_TIER_DECIMALS),
            totalLiquidityUsd: totalLiquidityUsdTruncated,
            percentage,
            // Not String(pool.tvl): that switches to exponential notation below 1e-6 or at/above 1e21,
            // unlike the plain-decimal wire string this replaced. maximumFractionDigits: 100 (the
            // ECMA-402 ceiling) keeps every representable digit down to ~1e-100, well past any real
            // dust TVL.
            tvl: pool.tvl.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 100 }),
            created: true,
            boostedApr: pool.rewardApr,
            rewards: pool.rewards,
            protocolFee: pool.protocolFee,
          } satisfies FeeTierData
        }
      }
    }

    const mergedFeeTierData = mergeFeeTiers({
      feeTiers: feeTierData,
      defaultFeeData,
      formatPercent,
      formattedDynamicFeeTier: t('fee.dynamic'),
    })

    // Overlay on-chain truth: mark any pool that's unavailable on-chain (already initialized, or reserved
    // by a live auction) as `created`, even if the indexed data didn't surface it, so existing-pool gates
    // can't be bypassed.
    for (const key of unavailableFeeTierKeys) {
      const existing = mergedFeeTierData[key]
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- Record index access can be undefined at runtime
      if (existing) {
        mergedFeeTierData[key] = { ...existing, created: true }
        continue
      }
      const candidate = onChainFeeTierCandidates.find(
        (tier) => getFeeTierKey({ feeTier: tier.feeAmount, tickSpacing: tier.tickSpacing }) === key,
      )
      if (candidate) {
        mergedFeeTierData[key] = {
          fee: { isDynamic: false, feeAmount: candidate.feeAmount, tickSpacing: candidate.tickSpacing },
          formattedFee: formatPercent(candidate.feeAmount / BIPS_BASE, MAX_FEE_TIER_DECIMALS),
          totalLiquidityUsd: 0,
          percentage: new Percent(0, 100),
          created: true,
          tvl: '0',
        } satisfies FeeTierData
      }
    }

    return {
      feeTierData: mergedFeeTierData,
      hasExistingFeeTiers: Object.values(feeTierData).length > 0,
    }
  }, [pools, sdkCurrencies, defaultFeeData, formatPercent, t, unavailableFeeTierKeys, onChainFeeTierCandidates])

  return {
    ...mergedResult,
    // Pending until both the indexed data and (when requested) the on-chain existence check settle, so
    // callers can withhold the fee-tier UI until the final created/blocked state is known (no enabled→disabled
    // flash). A failed read — v2 ListPools or the on-chain check — keeps this set (fail closed) so the UI
    // stays gated rather than showing an unverified tier as available.
    isLoading:
      (shouldFetchPools && (isV2PoolsLoading || isV2PoolsError || isLookupAddressLoading)) ||
      (checkOnChainPoolExistence && (isOnChainExistenceLoading || isOnChainExistenceError)),
    // Exposed separately for callers with nothing to gate, which need a failed read to settle rather
    // than stay pending — e.g. the range chart borrowing a sibling pool's history.
    isError: (shouldFetchPools && isV2PoolsError) || (checkOnChainPoolExistence && Boolean(isOnChainExistenceError)),
  }
}
