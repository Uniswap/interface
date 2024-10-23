// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { Pair, computePairAddress } from '@uniswap/v2-sdk'
import { Pool, Position, TICK_SPACINGS, TickMath, encodeSqrtRatioX96, nearestUsableTick } from '@uniswap/v3-sdk'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
import { getPairFromRest, getPoolFromRest, parseV3FeeTier } from 'components/Liquidity/utils'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import JSBI from 'jsbi'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { CreatePositionInfo, PositionState, PriceRangeInfo, PriceRangeState } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import { tryParseTick } from 'state/mint/v3/utils'
import { PositionField } from 'types/position'
import { useGetPair } from 'uniswap/src/data/rest/getPair'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getTickToPrice } from 'utils/getTickToPrice'

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(state: PositionState): CreatePositionInfo {
  const { chainId } = useAccount()
  const {
    currencyInputs: { TOKEN0: token0Input, TOKEN1: token1Input },
    protocolVersion,
  } = state

  const inputCurrencyInfo = useCurrencyInfo(token0Input)
  const outputCurrencyInfo = useCurrencyInfo(token1Input)
  const currencies = useMemo(
    () => ({ TOKEN0: inputCurrencyInfo?.currency, TOKEN1: outputCurrencyInfo?.currency }),
    [inputCurrencyInfo, outputCurrencyInfo],
  )

  // TODO (WEB-4920): skip the following logic if creating a v4 position, because v4 allows native
  const { TOKEN0, TOKEN1 } = currencies
  const tokens = useMemo(
    () =>
      TOKEN0 && TOKEN1
        ? [TOKEN0?.isNative ? TOKEN0.wrapped : TOKEN0, TOKEN1?.isNative ? TOKEN1.wrapped : TOKEN1]
        : undefined,
    [TOKEN0, TOKEN1],
  )
  const sortedTokens = tokens && tokens.toSorted((a, b) => (!b ? -1 : a?.sortsBefore(b) ? -1 : 1))

  const poolsQueryEnabled = protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
  const { data: poolData } = useGetPoolsByTokens(
    {
      fee: state.fee,
      chainId,
      protocolVersions: [protocolVersion],
      token0: sortedTokens?.[0].address,
      token1: sortedTokens?.[1].address,
    },
    poolsQueryEnabled,
  )

  const pool = useMemo(() => {
    return getPoolFromRest({
      pool: poolData?.pools?.[0],
      token0: sortedTokens?.[0],
      token1: sortedTokens?.[1],
      protocolVersion: ProtocolVersion.V3,
    })
  }, [poolData?.pools, sortedTokens])

  const pairsQueryEnabled = protocolVersion === ProtocolVersion.V2
  const pairAddress = useMemo(() => {
    return sortedTokens && sortedTokens[0] && sortedTokens[1]
      ? computePairAddress({
          factoryAddress: V2_FACTORY_ADDRESSES[sortedTokens[0].chainId],
          tokenA: sortedTokens[0],
          tokenB: sortedTokens[1],
        })
      : undefined
  }, [sortedTokens])

  const { data: pairData } = useGetPair(
    {
      chainId: chainId ?? (UniverseChainId.Mainnet as number),
      pairAddress,
    },
    pairsQueryEnabled,
  )

  const pair = useMemo(() => {
    if (!sortedTokens || !sortedTokens[0] || !sortedTokens[1]) {
      return undefined
    }

    return getPairFromRest({ pair: pairData?.pair, token0: sortedTokens[0], token1: sortedTokens[1] })
  }, [pairData, sortedTokens])

  return useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2) {
      return {
        currencies,
        protocolVersion,
        pair: pair ?? undefined,
        tokens,
        sortedTokens,
      }
    }

    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        currencies,
        protocolVersion: ProtocolVersion.UNSPECIFIED,
      }
    }

    return {
      currencies,
      protocolVersion,
      pool,
      tokens,
      sortedTokens,
    }
  }, [protocolVersion, currencies, pool, tokens, sortedTokens, pair])
}

export function useDerivedPriceRangeInfo(state: PriceRangeState): PriceRangeInfo {
  const {
    positionState: { fee },
    derivedPositionInfo,
  } = useCreatePositionContext()
  const account = useAccount()

  const { sortedTokens, tokens, protocolVersion, currencies } = derivedPositionInfo
  const pool =
    protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
      ? derivedPositionInfo.pool
      : undefined

  const [sortedToken0, sortedToken1] = sortedTokens ?? [undefined, undefined]
  const [baseToken, quoteToken] = tokens
    ? state.priceInverted
      ? [tokens?.[1], tokens?.[0]]
      : tokens
    : [undefined, undefined]

  const parsedV3FeeTier = parseV3FeeTier(fee.toString())
  const tickSpaceLimits = useMemo(
    () => [
      parsedV3FeeTier ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[parsedV3FeeTier]) : undefined,
      parsedV3FeeTier ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[parsedV3FeeTier]) : undefined,
    ],
    [parsedV3FeeTier],
  )

  const invertPrice = Boolean(baseToken && sortedToken0 && !baseToken.equals(sortedToken0))
  const [baseRangeInput, quoteRangeInput] = invertPrice
    ? [state.maxPrice, state.minPrice]
    : [state.minPrice, state.maxPrice]
  const lowerTick =
    baseRangeInput === ''
      ? tickSpaceLimits[0]
      : invertPrice
        ? tryParseTick(sortedToken1, sortedToken0, fee, state.maxPrice)
        : tryParseTick(sortedToken0, sortedToken1, fee, state.minPrice)
  const upperTick =
    quoteRangeInput === ''
      ? tickSpaceLimits[1]
      : invertPrice
        ? tryParseTick(sortedToken1, sortedToken0, fee, state.minPrice)
        : tryParseTick(sortedToken0, sortedToken1, fee, state.maxPrice)
  const ticks = useMemo(() => [lowerTick, upperTick], [lowerTick, upperTick])
  const invalidRange = Boolean(lowerTick && upperTick && lowerTick >= upperTick)

  const ticksAtLimit = useMemo(
    () => (state.fullRange ? [true, true] : [lowerTick === tickSpaceLimits[0], upperTick === tickSpaceLimits[1]]),
    [lowerTick, state.fullRange, tickSpaceLimits, upperTick],
  )

  const pricesAtLimit = useMemo(
    () => [
      getTickToPrice(sortedToken0, sortedToken1, tickSpaceLimits[0]),
      getTickToPrice(sortedToken0, sortedToken1, tickSpaceLimits[1]),
    ],
    [sortedToken0, sortedToken1, tickSpaceLimits],
  )

  const pricesAtTicks = useMemo(
    () => [getTickToPrice(sortedToken0, sortedToken1, ticks[0]), getTickToPrice(sortedToken0, sortedToken1, ticks[1])],
    [sortedToken0, sortedToken1, ticks],
  )

  const baseAndQuoteTokens = useMemo(
    () => (baseToken && quoteToken ? [baseToken, quoteToken] : undefined),
    [baseToken, quoteToken],
  )

  const isSorted = useMemo(() => {
    if (!baseToken || !quoteToken) {
      return false
    }

    return baseToken.sortsBefore(quoteToken)
  }, [baseToken, quoteToken])

  const prices = useMemo(() => {
    if (!baseToken || !quoteToken) {
      return [undefined, undefined]
    }

    const lowerPrice = state.fullRange ? pricesAtLimit[0] : pricesAtTicks[0]
    const upperPrice = state.fullRange ? pricesAtLimit[1] : pricesAtTicks[1]

    const minPrice = isSorted ? lowerPrice : upperPrice?.invert()
    const maxPrice = isSorted ? upperPrice : lowerPrice?.invert()

    return [minPrice, maxPrice]
  }, [baseToken, isSorted, pricesAtLimit, pricesAtTicks, quoteToken, state.fullRange])

  const price = useMemo(() => {
    if (!pool || !baseToken || !quoteToken) {
      return undefined
    }

    const isSorted = baseToken.sortsBefore(quoteToken)
    return isSorted ? pool.token0Price : pool.token1Price
  }, [baseToken, pool, quoteToken])

  const invalidPrice = useMemo(() => {
    const sqrtRatioX96 = price ? encodeSqrtRatioX96(price.numerator, price.denominator) : undefined
    return (
      price &&
      sqrtRatioX96 &&
      !(
        JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
        JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)
      )
    )
  }, [price])

  const outOfRange = Boolean(
    !invalidRange && price && prices[0] && prices[1] && (price.lessThan(prices[0]) || price.greaterThan(prices[1])),
  )

  const deposit0Disabled = Boolean(upperTick && pool && pool.tickCurrent >= upperTick)
  const deposit1Disabled = Boolean(lowerTick && pool && pool.tickCurrent <= lowerTick)

  const depositADisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && pool && sortedTokens && sortedTokens[0] && pool.token0.equals(sortedTokens[0])) ||
        (deposit1Disabled && pool && sortedTokens && sortedTokens[0] && pool.token1.equals(sortedTokens[0])),
    )
  const depositBDisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && pool && sortedTokens && sortedTokens[1] && pool.token0.equals(sortedTokens[1])) ||
        (deposit1Disabled && pool && sortedTokens && sortedTokens[1] && pool.token1.equals(sortedTokens[1])),
    )

  const { inputTax: currencyATax, outputTax: currencyBTax } = useSwapTaxes(
    currencies[PositionField.TOKEN0]?.isToken ? currencies[PositionField.TOKEN0].address : undefined,
    currencies[PositionField.TOKEN1]?.isToken ? currencies[PositionField.TOKEN1].address : undefined,
    account.chainId,
  )

  const isTaxed = currencyATax.greaterThan(0) || currencyBTax.greaterThan(0)

  return useMemo(
    () => ({
      ticks,
      ticksAtLimit,
      isSorted,
      price,
      prices,
      pricesAtTicks,
      pricesAtLimit,
      tickSpaceLimits,
      baseAndQuoteTokens,
      invertPrice,
      invalidPrice,
      invalidRange,
      outOfRange,
      deposit0Disabled: depositADisabled,
      deposit1Disabled: depositBDisabled,
      isTaxed,
    }),
    [
      tickSpaceLimits,
      ticks,
      ticksAtLimit,
      isSorted,
      price,
      prices,
      pricesAtTicks,
      pricesAtLimit,
      baseAndQuoteTokens,
      invertPrice,
      invalidPrice,
      invalidRange,
      outOfRange,
      depositADisabled,
      depositBDisabled,
      isTaxed,
    ],
  )
}

export type UseDepositInfoProps = {
  protocolVersion: ProtocolVersion
  address?: string
  token0?: Currency
  token1?: Currency
  exactField: PositionField
  exactAmount?: string
  skipDependentAmount?: boolean
  deposit0Disabled?: boolean
  deposit1Disabled?: boolean
} & (
  | {
      protocolVersion: ProtocolVersion.V3 | ProtocolVersion.V4
      pool?: Pool
      tickLower?: number
      tickUpper?: number
    }
  | {
      protocolVersion: ProtocolVersion.V2
      pair?: Pair
    }
  | {
      protocolVersion: ProtocolVersion.UNSPECIFIED
    }
)

export function useDerivedDepositInfo(state: DepositState): DepositInfo {
  const account = useAccount()
  const { derivedPositionInfo } = useCreatePositionContext()
  const {
    derivedPriceRangeInfo: { ticks, invalidRange, outOfRange, deposit0Disabled, deposit1Disabled },
  } = usePriceRangeContext()
  const { exactAmount, exactField } = state
  const { protocolVersion, sortedTokens } = derivedPositionInfo

  const pool =
    protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
      ? derivedPositionInfo.pool
      : undefined

  const pair = protocolVersion === ProtocolVersion.V2 ? derivedPositionInfo.pair : undefined

  const [token0, token1] = sortedTokens ?? [undefined, undefined]
  const tickLower = ticks?.[0]
  const tickUpper = ticks?.[1]

  const depositInfoProps: UseDepositInfoProps = useMemo(() => {
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        protocolVersion,
        exactField,
      }
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return {
        protocolVersion,
        pair,
        address: account.address,
        token0,
        token1,
        exactField,
        exactAmount,
      }
    }

    return {
      protocolVersion,
      pool,
      address: account.address,
      tickLower,
      tickUpper,
      token0,
      token1,
      exactField,
      exactAmount,
      skipDependentAmount: outOfRange || invalidRange,
      deposit0Disabled,
      deposit1Disabled,
    }
  }, [
    account.address,
    deposit0Disabled,
    deposit1Disabled,
    exactAmount,
    exactField,
    invalidRange,
    outOfRange,
    pair,
    pool,
    protocolVersion,
    tickLower,
    tickUpper,
    token0,
    token1,
  ])

  return useDepositInfo(depositInfoProps)
}

export function useDepositInfo(state: UseDepositInfoProps): DepositInfo {
  const account = useAccount()
  const { protocolVersion, address, token0, token1, exactField, exactAmount, deposit0Disabled, deposit1Disabled } =
    state
  const [token0Balance, token1Balance] = useCurrencyBalances(address, [token0, token1])

  const [independentToken, dependentToken] = exactField === PositionField.TOKEN0 ? [token0, token1] : [token1, token0]
  const independentAmount = tryParseCurrencyAmount(exactAmount, independentToken)

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    if (state.skipDependentAmount) {
      return undefined
    }

    const wrappedIndependentAmount = independentAmount?.wrapped

    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return undefined
    }

    if (protocolVersion === ProtocolVersion.V2) {
      const pair = state.pair
      const [token0Wrapped, token1Wrapped] = [token0?.wrapped, token1?.wrapped]

      if (token0Wrapped && token1Wrapped && wrappedIndependentAmount && pair) {
        const dependentTokenAmount =
          exactField === PositionField.TOKEN0
            ? pair.priceOf(token0Wrapped).quote(wrappedIndependentAmount)
            : pair.priceOf(token1Wrapped).quote(wrappedIndependentAmount)
        return dependentToken?.isNative
          ? CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
          : dependentTokenAmount
      }

      return undefined
    }

    const { tickLower, tickUpper, pool } = state

    if (!tickLower || !tickUpper || !pool || !independentAmount || !wrappedIndependentAmount) {
      return undefined
    }

    const position: Position | undefined = wrappedIndependentAmount.currency.equals(pool.token0)
      ? Position.fromAmount0({
          pool,
          tickLower,
          tickUpper,
          amount0: independentAmount.quotient,
          useFullPrecision: true,
        })
      : Position.fromAmount1({
          pool,
          tickLower,
          tickUpper,
          amount1: independentAmount.quotient,
        })

    const dependentTokenAmount = wrappedIndependentAmount.currency.equals(pool.token0)
      ? position.amount1
      : position.amount0
    return dependentToken && CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
  }, [independentAmount, protocolVersion, state, dependentToken, token0?.wrapped, token1?.wrapped, exactField])

  const independentTokenUSDValue = useUSDCValue(independentAmount) || undefined
  const dependentTokenUSDValue = useUSDCValue(dependentAmount) || undefined

  const dependentField = exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0

  const parsedAmounts: { [field in PositionField]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [PositionField.TOKEN0]: exactField === PositionField.TOKEN0 ? independentAmount : dependentAmount,
      [PositionField.TOKEN1]: exactField === PositionField.TOKEN0 ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, exactField])
  const { [PositionField.TOKEN0]: currency0Amount, [PositionField.TOKEN1]: currency1Amount } = parsedAmounts

  const { t } = useTranslation()
  const error = useMemo(() => {
    if (!account.isConnected) {
      return <ConnectWalletButtonText />
    }

    if (
      (!parsedAmounts[PositionField.TOKEN0] && !deposit0Disabled) ||
      (!parsedAmounts[PositionField.TOKEN1] && !deposit1Disabled)
    ) {
      return t('common.noAmount.error')
    }

    if (currency0Amount && token0Balance?.lessThan(currency0Amount)) {
      return (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{
            tokenSymbol: token0?.symbol,
          }}
        />
      )
    }

    if (currency1Amount && token1Balance?.lessThan(currency1Amount)) {
      return (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{
            tokenSymbol: token1?.symbol,
          }}
        />
      )
    }

    return undefined
  }, [
    account.isConnected,
    parsedAmounts,
    deposit0Disabled,
    deposit1Disabled,
    currency0Amount,
    token0Balance,
    currency1Amount,
    token1Balance,
    t,
    token0?.symbol,
    token1?.symbol,
  ])

  return useMemo(
    () => ({
      currencyBalances: { [PositionField.TOKEN0]: token0Balance, [PositionField.TOKEN1]: token1Balance },
      formattedAmounts: { [exactField]: exactAmount, [dependentField]: dependentAmount?.toExact() },
      currencyAmounts: { [exactField]: independentAmount, [dependentField]: dependentAmount },
      currencyAmountsUSDValue: { [exactField]: independentTokenUSDValue, [dependentField]: dependentTokenUSDValue },
      error,
    }),
    [
      token0Balance,
      token1Balance,
      exactField,
      exactAmount,
      dependentField,
      dependentAmount,
      independentAmount,
      independentTokenUSDValue,
      dependentTokenUSDValue,
      error,
    ],
  )
}
