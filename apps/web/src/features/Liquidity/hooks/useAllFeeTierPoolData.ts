import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
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
}: {
  chainId?: number
  protocolVersion: ProtocolVersion
  sdkCurrencies: { TOKEN0: Maybe<Currency>; TOKEN1: Maybe<Currency> }
  hook: string
  withDynamicFeeTier?: boolean
}): { feeTierData: Record<string, FeeTierData>; hasExistingFeeTiers: boolean } {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const isPlaceholderToken = (c: Maybe<Currency>) => c?.isToken && c.address === NEW_TOKEN_PLACEHOLDER_ADDRESS
  const shouldFetchPools =
    Boolean(chainId && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) &&
    !isPlaceholderToken(sdkCurrencies.TOKEN0) &&
    !isPlaceholderToken(sdkCurrencies.TOKEN1)

  const { data: poolData } = useGetPoolsByTokens(
    {
      chainId,
      protocolVersions: [protocolVersion],
      token0: getTokenOrZeroAddress(sdkCurrencies.TOKEN0),
      token1: getTokenOrZeroAddress(sdkCurrencies.TOKEN1),
      hooks: hook,
    },
    shouldFetchPools,
  )

  return useMemo(() => {
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
          } satisfies FeeTierData
        }
      }
    }

    return {
      feeTierData: mergeFeeTiers({
        feeTiers: feeTierData,
        defaultFeeData: Object.values(
          getDefaultFeeTiersForChainWithDynamicFeeTier({
            chainId,
            dynamicFeeTierEnabled: withDynamicFeeTier,
            protocolVersion,
          }),
        ),
        formatPercent,
        formattedDynamicFeeTier: t('fee.dynamic'),
      }),
      hasExistingFeeTiers: Object.values(feeTierData).length > 0,
    }
  }, [poolData, sdkCurrencies, chainId, withDynamicFeeTier, formatPercent, protocolVersion, t])
}
