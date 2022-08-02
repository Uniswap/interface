import React, { ReactNode, useCallback, useMemo } from 'react'
import { AppState } from '../../index'

import { Currency, CurrencyAmount, Price, Rounding, Token } from '@kyberswap/ks-sdk-core'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  Pool,
  Position,
  priceToClosestTick,
  TICK_SPACINGS,
  TickMath,
  tickToPrice,
  FullMath,
  SqrtPriceMath,
} from '@kyberswap/ks-sdk-elastic'
import {
  Bound,
  Field,
  setFullRange,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
} from './actions'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { PoolState, usePool } from 'hooks/usePools'
import { tryParseAmount } from 'state/swap/hooks'
import JSBI from 'jsbi'
import { tryParseTick } from './utils'
import { getTickToPrice } from 'utils/getTickToPrice'
import { BIG_INT_ZERO } from '../../../constants'
import { Trans } from '@lingui/macro'
import { ZERO } from '@kyberswap/ks-sdk-classic'

export function useProAmmMintState(): AppState['mintV2'] {
  return useAppSelector(state => state.mintV2)
}

export function useProAmmMintActionHandlers(
  noLiquidity: boolean | undefined,
): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  onStartPriceInput: (typedValue: string) => void
} {
  const dispatch = useAppDispatch()
  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity],
  )

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity],
  )

  const onLeftRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeLeftRangeInput({ typedValue }))
    },
    [dispatch],
  )

  const onRightRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeRightRangeInput({ typedValue }))
    },
    [dispatch],
  )

  const onStartPriceInput = useCallback(
    (typedValue: string) => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch],
  )
  return {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
  }
}

export function useProAmmDerivedMintInfo(
  currencyA?: Currency,
  currencyB?: Currency,
  feeAmount?: FeeAmount,
  baseCurrency?: Currency,
  // override for existing position
  existingPosition?: Position,
): {
  pool?: Pool | null
  poolState: PoolState
  ticks: { [bound in Bound]?: number | undefined }
  price?: Price<Token, Token>
  pricesAtTicks: {
    [bound in Bound]?: Price<Token, Token> | undefined
  }
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  dependentField: Field
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  position: Position | undefined
  noLiquidity?: boolean
  errorMessage?: ReactNode
  invalidPool: boolean
  outOfRange: boolean
  invalidRange: boolean
  depositADisabled: boolean
  depositBDisabled: boolean
  invertPrice: boolean
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  amount0Unlock: JSBI
  amount1Unlock: JSBI
} {
  const { account } = useActiveWeb3React()
  const {
    independentField,
    typedValue,
    leftRangeTypedValue,
    rightRangeTypedValue,
    startPriceTypedValue,
  } = useProAmmMintState()
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // currencies
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB],
  )
  // formatted with tokens
  const [tokenA, tokenB, baseToken] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped], [
    currencyA,
    currencyB,
    baseCurrency,
  ])

  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB],
  )
  // balances
  const balances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]),
  )
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1],
  }

  // pool
  const [poolState, pool] = usePool(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B], feeAmount)

  const noLiquidity = poolState === PoolState.NOT_EXISTS
  // note to parse inputs in reverse
  const invertPrice = Boolean(baseToken && token0 && !baseToken.equals(token0))

  // always returns the price with 0 as base token
  const price: Price<Token, Token> | undefined = useMemo(() => {
    // if no liquidity use typed value
    if (noLiquidity) {
      const parsedQuoteAmount = tryParseAmount(startPriceTypedValue, invertPrice ? token0 : token1)
      if (parsedQuoteAmount && token0 && token1) {
        const baseAmount = tryParseAmount('1', invertPrice ? token1 : token0)
        const price =
          baseAmount && parsedQuoteAmount
            ? new Price(
                baseAmount.currency,
                parsedQuoteAmount.currency,
                baseAmount.quotient,
                parsedQuoteAmount.quotient,
              )
            : undefined
        return (invertPrice ? price?.invert() : price) ?? undefined
      }
      return undefined
    } else {
      // get the amount of quote currency
      return pool && token0 ? pool.priceOf(token0) : undefined
    }
  }, [noLiquidity, startPriceTypedValue, invertPrice, token1, token0, pool])
  // check for invalid price input (converts to invalid ratio)
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
  // used for ratio calculation when pool not initialized
  const mockPool = useMemo(() => {
    if (tokenA && tokenB && feeAmount && price && !invalidPrice) {
      const currentTick = priceToClosestTick(price)
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
      return new Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), JSBI.BigInt(0), currentTick, [])
    } else {
      return undefined
    }
  }, [feeAmount, invalidPrice, price, tokenA, tokenB])

  // if pool exists use it, if not use the mock pool
  const poolForPosition: Pool | undefined = pool ?? mockPool

  // lower and upper limits in the tick space for `feeAmount<Trans>
  const tickSpaceLimits: {
    [bound in Bound]: number | undefined
  } = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]) : undefined,
      [Bound.UPPER]: feeAmount ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]) : undefined,
    }),
    [feeAmount],
  )

  // parse typed range values and determine closest ticks
  // lower should always be a smaller tick
  const ticks: {
    [key: string]: number | undefined
  } = useMemo(() => {
    //case NO invert
    //      tickLower = tryParseTick(0, 1, left)
    //      tickUpper = tryParseTick(0, 1, right)
    //case invert
    //      tickLower = tryParseTick(1, 0, right)
    //      tickUpper = tryParseTick(1, 0, left)
    //priceToClosestTick always return tick of token0/token1 => calc [1/right, 1/left] as price of token0/token1
    return {
      [Bound.LOWER]:
        typeof existingPosition?.tickLower === 'number'
          ? existingPosition.tickLower
          : (invertPrice && typeof rightRangeTypedValue === 'boolean') ||
            (!invertPrice && typeof leftRangeTypedValue === 'boolean')
          ? tickSpaceLimits[Bound.LOWER]
          : invertPrice
          ? tryParseTick(token1, token0, feeAmount, rightRangeTypedValue.toString())
          : tryParseTick(token0, token1, feeAmount, leftRangeTypedValue.toString()),
      [Bound.UPPER]:
        typeof existingPosition?.tickUpper === 'number'
          ? existingPosition.tickUpper
          : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
            (invertPrice && typeof leftRangeTypedValue === 'boolean')
          ? tickSpaceLimits[Bound.UPPER]
          : invertPrice
          ? tryParseTick(token1, token0, feeAmount, leftRangeTypedValue.toString())
          : tryParseTick(token0, token1, feeAmount, rightRangeTypedValue.toString()),
    }
  }, [
    existingPosition,
    feeAmount,
    invertPrice,
    leftRangeTypedValue,
    rightRangeTypedValue,
    token0,
    token1,
    tickSpaceLimits,
  ])

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks || {}

  // specifies whether the lower and upper ticks is at the exteme bounds
  const ticksAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
      [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    }),
    [tickSpaceLimits, tickLower, tickUpper, feeAmount],
  )

  // mark invalid range
  const invalidRange = Boolean(typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper)

  // always returns the price with 0 as base token
  const pricesAtTicks = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice(token0, token1, ticks[Bound.LOWER]),
      [Bound.UPPER]: getTickToPrice(token0, token1, ticks[Bound.UPPER]),
    }
  }, [token0, token1, ticks])
  const { [Bound.LOWER]: lowerPrice, [Bound.UPPER]: upperPrice } = pricesAtTicks

  // liquidity range warning
  const outOfRange = Boolean(
    !invalidRange && price && lowerPrice && upperPrice && (price.lessThan(lowerPrice) || price.greaterThan(upperPrice)),
  )

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(
    typedValue,
    currencies[independentField],
  )

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped
    const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
    if (
      independentAmount &&
      wrappedIndependentAmount &&
      typeof tickLower === 'number' &&
      typeof tickUpper === 'number' &&
      poolForPosition
    ) {
      // if price is out of range or invalid range - return 0 (single deposit will be independent)
      if (outOfRange || invalidRange) {
        return undefined
      }

      const position: Position | undefined = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? Position.fromAmount0({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount0: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the theoretical position
          })
        : Position.fromAmount1({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount1: independentAmount.quotient,
          })

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? position.amount1
        : position.amount0
      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    }
    return undefined
  }, [
    independentAmount,
    outOfRange,
    dependentField,
    currencyB,
    currencyA,
    tickLower,
    tickUpper,
    poolForPosition,
    invalidRange,
  ])

  const parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, independentField])
  // single deposit only if price is out of range
  const deposit0Disabled = Boolean(
    typeof tickUpper === 'number' && poolForPosition && poolForPosition.tickCurrent >= tickUpper,
  )
  const deposit1Disabled = Boolean(
    typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent <= tickLower,
  )
  // sorted for token order
  const depositADisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && tokenA && poolForPosition.token0.equals(tokenA)) ||
        (deposit1Disabled && poolForPosition && tokenA && poolForPosition.token1.equals(tokenA)),
    )
  const depositBDisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && tokenB && poolForPosition.token0.equals(tokenB)) ||
        (deposit1Disabled && poolForPosition && tokenB && poolForPosition.token1.equals(tokenB)),
    )

  // create position entity based on users selection
  const position: Position | undefined = useMemo(() => {
    if (
      !poolForPosition ||
      !tokenA ||
      !tokenB ||
      typeof tickLower !== 'number' ||
      typeof tickUpper !== 'number' ||
      invalidRange
    ) {
      return undefined
    }
    // mark as 0 if disabled because out of range
    const amount0 = !deposit0Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
      : BIG_INT_ZERO
    const amount1 = !deposit1Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient
      : BIG_INT_ZERO

    if (amount0 !== undefined && amount1 !== undefined) {
      return Position.fromAmounts({
        pool: poolForPosition,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true, // we want full precision for the theoretical position
      })
    } else {
      return undefined
    }
  }, [
    parsedAmounts,
    poolForPosition,
    tokenA,
    tokenB,
    deposit0Disabled,
    deposit1Disabled,
    invalidRange,
    tickLower,
    tickUpper,
  ])

  const amount0Unlock = price && noLiquidity ? FullMath.mulDiv(
    SqrtPriceMath.getAmount0Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
    JSBI.BigInt('105'),
    JSBI.BigInt('100'),
  ) : JSBI.BigInt('0')
  const amount1Unlock = price && noLiquidity ? FullMath.mulDiv(
    SqrtPriceMath.getAmount1Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
    JSBI.BigInt('105'),
    JSBI.BigInt('100'),
  ) : JSBI.BigInt('0')
  let errorMessage: ReactNode | undefined
  if (!account) {
    errorMessage = <Trans>Connect Wallet</Trans>
  }

  if (poolState === PoolState.INVALID) {
    errorMessage = errorMessage ?? <Trans>Invalid pair</Trans>
  }

  if (invalidPrice) {
    errorMessage = errorMessage ?? <Trans>Invalid price input</Trans>
  }

  if (
    (!parsedAmounts[Field.CURRENCY_A] && !depositADisabled) ||
    (!parsedAmounts[Field.CURRENCY_B] && !depositBDisabled)
  ) {
    errorMessage = errorMessage ?? <Trans>Enter an amount</Trans>
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts
  
  if ((currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) || 
    (noLiquidity && depositADisabled && currencyBalances?.[Field.CURRENCY_A]?.equalTo(ZERO))
  ) {
    errorMessage = <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>
  } else if ((noLiquidity && currencyAAmount && currencyA && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount.add(CurrencyAmount.fromRawAmount(currencyA, !invertPrice ? amount0Unlock : amount1Unlock))))) {
    errorMessage = <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance.</Trans>
  }

  if ((currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) || 
    (noLiquidity && depositBDisabled && currencyBalances?.[Field.CURRENCY_B]?.equalTo(ZERO))
  ) {
    errorMessage = <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance</Trans>
  } else if ((noLiquidity && currencyBAmount && currencyB && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount.add(CurrencyAmount.fromRawAmount(currencyB, !invertPrice ? amount1Unlock : amount0Unlock))))) {
    errorMessage = <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance.</Trans>
  } 
  const invalidPool = poolState === PoolState.INVALID

  return {
    dependentField,
    currencies,
    pool,
    poolState,
    currencyBalances,
    parsedAmounts,
    ticks,
    price,
    pricesAtTicks,
    position,
    noLiquidity,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    amount0Unlock,
    amount1Unlock
  }
}

export function useRangeHopCallbacks(
  baseCurrency: Currency | undefined,
  quoteCurrency: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  tickLower: number | undefined,
  tickUpper: number | undefined,
  pool?: Pool | undefined | null,
  price?: Price<Token, Token> | undefined | null,
) {
  const dispatch = useAppDispatch()

  const { startPriceTypedValue } = useProAmmMintState()
  const baseToken = useMemo(() => baseCurrency?.wrapped, [baseCurrency])
  const quoteToken = useMemo(() => quoteCurrency?.wrapped, [quoteCurrency])

  let initTick: number | undefined
  // if (price) {
  //   initTick = priceToClosestTick(price)
  // }

  if (pool) {
    initTick = pool.tickCurrent
  } else {
    initTick = tryParseTick(baseCurrency?.wrapped, quoteCurrency?.wrapped, feeAmount, startPriceTypedValue)
  }

  const getDecrementLower = useCallback(() => {
    if (baseToken && quoteToken && feeAmount) {
      if (typeof tickLower === 'number' && tickLower < TickMath.MAX_TICK - 2 && tickLower > TickMath.MIN_TICK + 2) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickLower - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      } else if (initTick) {
        const newPrice = tickToPrice(baseToken, quoteToken, initTick - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      }
    }
    return ''
  }, [baseToken, quoteToken, tickLower, feeAmount, initTick])

  const getIncrementLower = useCallback(() => {
    if (baseToken && quoteToken && feeAmount) {
      if (typeof tickLower === 'number' && tickLower < TickMath.MAX_TICK - 2 && tickLower > TickMath.MIN_TICK + 2) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickLower + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      } else if (initTick) {
        const newPrice = tickToPrice(baseToken, quoteToken, initTick + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      }
    }
    return ''
  }, [baseToken, quoteToken, tickLower, feeAmount, initTick])

  const getDecrementUpper = useCallback(() => {
    if (baseToken && quoteToken && feeAmount) {
      if (typeof tickUpper === 'number' && tickUpper < TickMath.MAX_TICK - 2 && tickUpper > TickMath.MIN_TICK + 2) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickUpper - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      } else if (initTick) {
        const newPrice = tickToPrice(baseToken, quoteToken, initTick - TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      }
    }
    return ''
  }, [baseToken, quoteToken, tickUpper, feeAmount, initTick])

  const getIncrementUpper = useCallback(() => {
    if (baseToken && quoteToken && feeAmount) {
      if (typeof tickUpper === 'number' && tickUpper < TickMath.MAX_TICK - 2 && tickUpper > TickMath.MIN_TICK + 2) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickUpper + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      } else if (initTick) {
        const newPrice = tickToPrice(baseToken, quoteToken, initTick + TICK_SPACINGS[feeAmount])
        return newPrice.toSignificant(9, undefined, Rounding.ROUND_UP)
      }
    }
    return ''
  }, [baseToken, quoteToken, tickUpper, feeAmount, initTick])

  const getSetFullRange = useCallback(() => {
    dispatch(setFullRange())
  }, [dispatch])

  return { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange }
}
