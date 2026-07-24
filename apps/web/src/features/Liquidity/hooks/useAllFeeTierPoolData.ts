import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { useV4PoolsInitializedOnChain } from '~/features/Liquidity/hooks/useV4PoolsInitializedOnChain'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import {
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  getFeeTierKey,
  MAX_FEE_TIER_DECIMALS,
  mergeFeeTiers,
} from '~/features/Liquidity/utils/feeTiers'
import { NEW_TOKEN_PLACEHOLDER_ADDRESS } from '~/pages/Liquidity/CreateAuction/types'
import { FeeTierData } from '~/types/liquidity'

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
}: {
  chainId?: number
  protocolVersion: ProtocolVersion
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
  hook: string
  withDynamicFeeTier?: boolean
  /**
   * When true, additionally verifies pool existence on-chain (`StateView.getSlot0`) for the default
   * tiers and any `additionalFeeTiersToCheck`, marking initialized pools as `created`. Required by flows
   * that must reject any existing pool (e.g. CCA auctions), since the indexed `listPools` data omits
   * abandoned/zero-liquidity pools the contract still blocks.
   */
  checkOnChainPoolExistence?: boolean
  /** Extra (non-default) fee tiers to include in the on-chain existence check, e.g. a user-entered custom tier. */
  additionalFeeTiersToCheck?: FeeData[]
}): { feeTierData: Record<string, FeeTierData>; hasExistingFeeTiers: boolean; isLoading: boolean } {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const isPlaceholderToken = (c: Maybe<Currency>) => c?.isToken && c.address === NEW_TOKEN_PLACEHOLDER_ADDRESS
  const shouldFetchPools =
    Boolean(chainId && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) &&
    !isPlaceholderToken(sdkCurrencies.TOKEN0) &&
    !isPlaceholderToken(sdkCurrencies.TOKEN1)

  const { data: poolData, isLoading: isPoolDataLoading } = useGetPoolsByTokens(
    {
      chainId,
      protocolVersions: [protocolVersion],
      token0: getTokenOrZeroAddress(sdkCurrencies.TOKEN0),
      token1: getTokenOrZeroAddress(sdkCurrencies.TOKEN1),
      hooks: hook,
    },
    shouldFetchPools,
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
  const onChainFeeTierCandidates = useMemo(
    () => [...defaultFeeData, ...(additionalFeeTiersToCheck ?? [])],
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

  const mergedResult = useMemo(() => {
    const liquiditySum = poolData?.pools.reduce(
      (sum, pool) => BigInt(pool.totalLiquidityUsd.split('.')[0] ?? '0') + sum,
      0n,
    )

    const feeTierData: Record<string, FeeTierData> = {}
    if (poolData && liquiditySum !== undefined && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) {
      for (const pool of poolData.pools) {
        const key = getFeeTierKey({ feeTier: pool.fee, tickSpacing: pool.tickSpacing, isDynamicFee: pool.isDynamicFee })
        if (!key) {
          continue
        }
        const totalLiquidityUsdTruncated = Number(pool.totalLiquidityUsd.split('.')[0] ?? '0')
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
              isDynamic: pool.isDynamicFee,
              feeAmount: pool.fee,
              tickSpacing: pool.tickSpacing,
            },
            formattedFee: pool.isDynamicFee
              ? t('fee.dynamic')
              : formatPercent(pool.fee / BIPS_BASE, MAX_FEE_TIER_DECIMALS),
            totalLiquidityUsd: totalLiquidityUsdTruncated,
            percentage,
            tvl: pool.totalLiquidityUsd,
            created: true,
            boostedApr: pool.boostedApr,
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
  }, [poolData, sdkCurrencies, defaultFeeData, formatPercent, t, unavailableFeeTierKeys, onChainFeeTierCandidates])

  return {
    ...mergedResult,
    // Pending until both the indexed data and (when requested) the on-chain existence check settle, so
    // callers can withhold the fee-tier UI until the final created/blocked state is known (no enabled→disabled
    // flash). A failed on-chain read keeps this set (fail closed) so the UI stays gated rather than showing an
    // unverified tier as available.
    isLoading:
      (shouldFetchPools && isPoolDataLoading) ||
      (checkOnChainPoolExistence && (isOnChainExistenceLoading || isOnChainExistenceError)),
  }
}
