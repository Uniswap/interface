import { BigNumber } from '@ethersproject/bignumber'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { Position as V3Position } from '@uniswap/v3-sdk'
import { Position as V4Position } from '@uniswap/v4-sdk'
import {
  BasePositionDerivedInfo,
  FeeTierData,
  PositionDerivedInfo,
  PositionInfo,
  PriceOrdering,
  V2PositionDerivedInfo,
  V3OrV4PositionDerivedInfo,
} from 'components/Liquidity/types'
import {
  MAX_FEE_TIER_DECIMALS,
  calculateInvertedValues,
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  mergeFeeTiers,
} from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import JSBI from 'jsbi'
import { OptionalCurrency } from 'pages/Pool/Positions/create/types'
import { getCurrencyAddressForTradingApi, getSortedCurrenciesTupleWithWrap } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LiquidityModalInitialState } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'
import { Bound } from 'state/mint/v3/actions'
import { BIPS_BASE, PollingInterval } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

function getPriceOrderingFromPositionForUI(position?: V3Position | V4Position): PriceOrdering {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

/**
 * @returns map of fee tier (in hundredths of bips) to more data about the Pool
 *
 */
export function useAllFeeTierPoolData({
  chainId,
  protocolVersion,
  currencies,
  withDynamicFeeTier = false,
  hook,
}: {
  chainId?: number
  protocolVersion: ProtocolVersion
  currencies: [OptionalCurrency, OptionalCurrency]
  hook: string
  withDynamicFeeTier?: boolean
}): { feeTierData: Record<number, FeeTierData>; hasExistingFeeTiers: boolean } {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const sortedCurrencies = getSortedCurrenciesTupleWithWrap(currencies[0], currencies[1], protocolVersion)

  const { data: poolData } = useGetPoolsByTokens(
    {
      chainId,
      protocolVersions: [protocolVersion],
      token0: getCurrencyAddressForTradingApi(sortedCurrencies[0]),
      token1: getCurrencyAddressForTradingApi(sortedCurrencies[1]),
      hooks: hook ?? ZERO_ADDRESS,
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
      feeTierData: mergeFeeTiers(
        feeTierData,
        Object.values(
          getDefaultFeeTiersForChainWithDynamicFeeTier({
            chainId,
            dynamicFeeTierEnabled: withDynamicFeeTier,
            protocolVersion,
          }),
        ),
        formatPercent,
        t('fee.dynamic'),
      ),
      hasExistingFeeTiers: Object.values(feeTierData).length > 0,
    }
  }, [poolData, sortedCurrencies, chainId, withDynamicFeeTier, formatPercent, protocolVersion, t])
}

export function usePositionDerivedInfo(positionInfo?: PositionInfo): PositionDerivedInfo {
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
  const { price: price0 } = useUSDCPrice(positionInfo?.currency0Amount?.currency, PollingInterval.Slow)
  const { price: price1 } = useUSDCPrice(positionInfo?.currency1Amount?.currency, PollingInterval.Slow)

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

  return useMemo(() => {
    const baseInfo: BasePositionDerivedInfo = {
      fiatFeeValue0,
      fiatFeeValue1,
      fiatValue0,
      fiatValue1,
      priceOrdering,
      feeValue0,
      feeValue1,
      apr,
      token0CurrentPrice: undefined,
      token1CurrentPrice: undefined,
    }
    if (!positionInfo) {
      return baseInfo
    }

    if (positionInfo.version === ProtocolVersion.V2) {
      return {
        ...baseInfo,
        version: ProtocolVersion.V2,
        token0CurrentPrice: undefined,
        token1CurrentPrice: undefined,
      } satisfies V2PositionDerivedInfo
    }

    return {
      ...baseInfo,
      version: positionInfo.version,
      token0CurrentPrice: positionInfo.pool?.token0Price,
      token1CurrentPrice: positionInfo.pool?.token1Price,
    } satisfies V3OrV4PositionDerivedInfo
  }, [fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, priceOrdering, feeValue0, feeValue1, positionInfo, apr])
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

  const isTickAtLimit = useIsTickAtLimit(tickSpacing, Number(tickLower), Number(tickUpper))

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
