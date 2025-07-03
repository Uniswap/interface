import { BigNumber } from '@ethersproject/bignumber'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Percent, Price } from '@uniswap/sdk-core'
import { FeeTierData, PositionInfo, PriceOrdering } from 'components/Liquidity/types'
import {
  MAX_FEE_TIER_DECIMALS,
  calculateInvertedValues,
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  mergeFeeTiers,
} from 'components/Liquidity/utils'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import JSBI from 'jsbi'
import { getTokenOrZeroAddress } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LiquidityModalInitialState } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'
import { Bound } from 'state/mint/v3/actions'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

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
}): { feeTierData: Record<number, FeeTierData>; hasExistingFeeTiers: boolean } {
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

    const feeTierData: Record<number, FeeTierData> = {}
    if (poolData && liquiditySum && sdkCurrencies.TOKEN0 && sdkCurrencies.TOKEN1) {
      for (const pool of poolData.pools) {
        const feeTier = pool.fee
        const totalLiquidityUsdTruncated = Number(pool.totalLiquidityUsd.split('.')[0] ?? '0')
        const percentage = liquiditySum.isZero()
          ? new Percent(0, 100)
          : new Percent(totalLiquidityUsdTruncated, liquiditySum.toString())
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (feeTierData[feeTier]) {
          feeTierData[feeTier].totalLiquidityUsd += totalLiquidityUsdTruncated
          feeTierData[feeTier].percentage = feeTierData[feeTier].percentage.add(percentage)
        } else {
          feeTierData[feeTier] = {
            id: pool.poolId,
            fee: {
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
        feeData: Object.values(
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

function useFormatTickPrice({
  price,
  atLimit,
  direction,
}: {
  price?: Price<Currency, Currency>
  atLimit: { [bound in Bound]?: boolean | undefined }
  direction: Bound
}): string {
  const { formatNumberOrString } = useLocalizationContext()

  if (atLimit[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price) {
    return '-'
  }

  return formatNumberOrString({
    value: price.toSignificant(),
    type: NumberType.TokenTx,
  })
}

export function useGetRangeDisplay({
  priceOrdering,
  pricesInverted,
  tickSpacing,
  tickLower,
  tickUpper,
}: {
  priceOrdering: PriceOrdering
  tickSpacing?: number
  tickLower?: string
  tickUpper?: string
  pricesInverted: boolean
}): {
  minPrice: string
  maxPrice: string
  tokenASymbol?: string
  tokenBSymbol?: string
  isFullRange?: boolean
} {
  const { priceLower, priceUpper, base, quote } = calculateInvertedValues({
    ...priceOrdering,
    invert: pricesInverted,
  })

  const isTickAtLimit = useIsTickAtLimit({ tickSpacing, tickLower: Number(tickLower), tickUpper: Number(tickUpper) })

  const minPrice = useFormatTickPrice({
    price: priceLower,
    atLimit: isTickAtLimit,
    direction: Bound.LOWER,
  })
  const maxPrice = useFormatTickPrice({
    price: priceUpper,
    atLimit: isTickAtLimit,
    direction: Bound.UPPER,
  })
  const tokenASymbol = quote?.symbol
  const tokenBSymbol = base?.symbol

  return {
    minPrice,
    maxPrice,
    tokenASymbol,
    tokenBSymbol,
    isFullRange: isTickAtLimit[Bound.LOWER] && isTickAtLimit[Bound.UPPER],
  }
}

export function usePositionCurrentPrice(positionInfo?: PositionInfo) {
  return useMemo(() => {
    if (positionInfo?.version === ProtocolVersion.V2) {
      return positionInfo.pair?.token1Price
    }

    return positionInfo?.pool?.token1Price
  }, [positionInfo])
}

/**
 * Parses the Positions API object from the modal state and returns the relevant information for the modals.
 */
export function useModalLiquidityInitialState(): LiquidityModalInitialState | undefined {
  const modalState = useAppSelector((state) => state.application.openModal)
  return modalState?.initialState
}

export function useGetPoolTokenPercentage(positionInfo?: PositionInfo) {
  const { totalSupply, liquidityAmount } = positionInfo ?? {}

  const poolTokenPercentage = useMemo(() => {
    return !!liquidityAmount && !!totalSupply && JSBI.greaterThanOrEqual(totalSupply.quotient, liquidityAmount.quotient)
      ? new Percent(liquidityAmount.quotient, totalSupply.quotient)
      : undefined
  }, [liquidityAmount, totalSupply])

  return poolTokenPercentage
}
