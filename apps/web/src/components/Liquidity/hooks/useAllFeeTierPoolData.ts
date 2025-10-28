import { BigNumber } from '@ethersproject/bignumber'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeTierData } from 'components/Liquidity/types'
import { getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import {
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  getFeeTierKey,
  MAX_FEE_TIER_DECIMALS,
  mergeFeeTiers,
} from 'components/Liquidity/utils/feeTiers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

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

  const { data: poolData } = useGetPoolsByTokens(
    {
      chainId,
      protocolVersions: [protocolVersion],
      token0: getTokenOrZeroAddress(sdkCurrencies.TOKEN0),
      token1: getTokenOrZeroAddress(sdkCurrencies.TOKEN1),
      hooks: hook,
    },
    Boolean(chainId && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1),
  )

  return useMemo(() => {
    const liquiditySum = poolData?.pools.reduce(
      (sum, pool) => BigNumber.from(pool.totalLiquidityUsd.split('.')[0] ?? '0').add(sum),
      BigNumber.from(0),
    )

    const feeTierData: Record<string, FeeTierData> = {}
    if (poolData && liquiditySum && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) {
      for (const pool of poolData.pools) {
        const key = getFeeTierKey(pool.fee, pool.isDynamicFee)
        const totalLiquidityUsdTruncated = Number(pool.totalLiquidityUsd.split('.')[0] ?? '0')
        const percentage = liquiditySum.isZero()
          ? new Percent(0, 100)
          : new Percent(totalLiquidityUsdTruncated, liquiditySum.toString())
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
