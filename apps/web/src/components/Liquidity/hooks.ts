import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { FeeTierData, PositionInfo } from 'components/Liquidity/types'
import {
  calculateInvertedValues,
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  mergeFeeTiers,
  parseV3FeeTier,
} from 'components/Liquidity/utils'
import { PriceOrdering, getPriceOrderingFromPositionForUI } from 'components/PositionListItem'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import JSBI from 'jsbi'
import { OptionalCurrency } from 'pages/Pool/Positions/create/types'
import { getCurrencyAddressForTradingApi, getSortedCurrenciesTupleWithWrap } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LiquidityModalInitialState } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'
import { Bound } from 'state/mint/v3/actions'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

/**
 * @returns map of fee tier (in hundredths of bips) to more data about the Pool
 *
 */
export function useAllFeeTierPoolData({
  chainId,
  protocolVersion,
  currencies,
  withDynamicFeeTier = false,
}: {
  chainId?: number
  protocolVersion: ProtocolVersion
  currencies: [OptionalCurrency, OptionalCurrency]
  withDynamicFeeTier?: boolean
}): { feeTierData: Record<number, FeeTierData>; hasExistingFeeTiers: boolean } {
  const { t } = useTranslation()
  const { formatPercent } = useFormatter()
  const sortedCurrencies = getSortedCurrenciesTupleWithWrap(currencies[0], currencies[1], protocolVersion)

  const { data: poolData } = useGetPoolsByTokens(
    {
      chainId,
      protocolVersions: [protocolVersion],
      token0: getCurrencyAddressForTradingApi(sortedCurrencies[0]),
      token1: getCurrencyAddressForTradingApi(sortedCurrencies[1]),
    },
    Boolean(chainId && sortedCurrencies?.[0] && sortedCurrencies?.[1]),
  )

  return useMemo(() => {
    const liquiditySum = poolData?.pools.reduce(
      (sum, pool) => BigNumber.from(pool.totalLiquidityUsd.split('.')?.[0] ?? '0').add(sum),
      BigNumber.from(0),
    )

    const feeTierData: Record<number, FeeTierData> = {}
    if (poolData && liquiditySum && sortedCurrencies?.[0] && sortedCurrencies?.[1]) {
      for (const pool of poolData.pools) {
        const feeTier = pool.fee
        const totalLiquidityUsdTruncated = Number(pool.totalLiquidityUsd.split('.')?.[0] ?? '0')
        const percentage = liquiditySum.isZero()
          ? new Percent(0, 100)
          : new Percent(totalLiquidityUsdTruncated, liquiditySum.toString())
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
            formattedFee: formatPercent(new Percent(pool.fee, 1000000)),
            totalLiquidityUsd: totalLiquidityUsdTruncated,
            percentage,
            tvl: pool.totalLiquidityUsd,
            created: true,
          } satisfies FeeTierData
        }
      }
    }

    return {
      feeTierData: mergeFeeTiers(
        feeTierData,
        Object.values(
          getDefaultFeeTiersForChainWithDynamicFeeTier({ chainId, dynamicFeeTierEnabled: withDynamicFeeTier }),
        ),
        formatPercent,
        t('fee.dynamic'),
      ),
      hasExistingFeeTiers: Object.values(feeTierData).length > 0,
    }
  }, [poolData, sortedCurrencies, chainId, withDynamicFeeTier, formatPercent, t])
}

/**
 * V3-specific hooks for a position parsed using parseRestPosition.
 */
export function useV3OrV4PositionDerivedInfo(positionInfo?: PositionInfo) {
  const {
    token0UncollectedFees,
    token1UncollectedFees,
    currency0Amount,
    currency1Amount,
    liquidity,
    tickLower,
    tickUpper,
    apr,
  } = positionInfo ?? {}
  const { price: price0 } = useUSDCPrice(currency0Amount?.currency)
  const { price: price1 } = useUSDCPrice(currency1Amount?.currency)

  const { feeValue0, feeValue1 } = useMemo(() => {
    if (!currency0Amount || !currency1Amount) {
      return {}
    }
    return {
      feeValue0: token0UncollectedFees
        ? CurrencyAmount.fromRawAmount(currency0Amount.currency, token0UncollectedFees)
        : undefined,
      feeValue1: token1UncollectedFees
        ? CurrencyAmount.fromRawAmount(currency1Amount.currency, token1UncollectedFees)
        : undefined,
    }
  }, [currency0Amount, currency1Amount, token0UncollectedFees, token1UncollectedFees])

  const { fiatFeeValue0, fiatFeeValue1 } = useMemo(() => {
    const amount0 = feeValue0 ? price0?.quote(feeValue0) : undefined
    const amount1 = feeValue1 ? price1?.quote(feeValue1) : undefined
    return {
      fiatFeeValue0: amount0,
      fiatFeeValue1: amount1,
    }
  }, [price0, price1, feeValue0, feeValue1])

  const { fiatValue0, fiatValue1 } = useMemo(() => {
    if (!price0 || !price1 || !currency0Amount || !currency1Amount) {
      return {}
    }
    const amount0 = price0.quote(currency0Amount)
    const amount1 = price1.quote(currency1Amount)
    return {
      fiatValue0: amount0,
      fiatValue1: amount1,
    }
  }, [price0, price1, currency0Amount, currency1Amount])

  const priceOrdering = useMemo(() => {
    if (
      (positionInfo?.version !== ProtocolVersion.V3 && positionInfo?.version !== ProtocolVersion.V4) ||
      !positionInfo.position ||
      !liquidity ||
      !tickLower ||
      !tickUpper
    ) {
      return {}
    }
    return getPriceOrderingFromPositionForUI(positionInfo.position)
  }, [liquidity, tickLower, tickUpper, positionInfo])

  return useMemo(
    () => ({
      fiatFeeValue0,
      fiatFeeValue1,
      fiatValue0,
      fiatValue1,
      priceOrdering,
      feeValue0,
      feeValue1,
      token0CurrentPrice:
        positionInfo?.version === ProtocolVersion.V3 || positionInfo?.version === ProtocolVersion.V4
          ? positionInfo.pool?.token0Price
          : undefined,
      token1CurrentPrice:
        positionInfo?.version === ProtocolVersion.V3 || positionInfo?.version === ProtocolVersion.V4
          ? positionInfo.pool?.token1Price
          : undefined,
      apr,
    }),
    [fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, priceOrdering, feeValue0, feeValue1, positionInfo, apr],
  )
}

export function useGetRangeDisplay({
  priceOrdering,
  pricesInverted,
  feeTier,
  tickLower,
  tickUpper,
}: {
  priceOrdering: PriceOrdering
  feeTier?: string
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
  const { formatTickPrice } = useFormatter()

  const { priceLower, priceUpper, base, quote } = calculateInvertedValues({
    ...priceOrdering,
    invert: pricesInverted,
  })

  const isTickAtLimit = useIsTickAtLimit(parseV3FeeTier(feeTier), Number(tickLower), Number(tickUpper))

  const minPrice = formatTickPrice({
    price: priceLower,
    atLimit: isTickAtLimit,
    direction: Bound.LOWER,
    numberType: NumberType.TokenTx,
  })
  const maxPrice = formatTickPrice({
    price: priceUpper,
    atLimit: isTickAtLimit,
    direction: Bound.UPPER,
    numberType: NumberType.TokenTx,
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
