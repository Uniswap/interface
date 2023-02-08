/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Fraction, Price, Rounding, Token } from '@kyberswap/ks-sdk-core'
import {
  FeeAmount,
  FullMath,
  Pool,
  Position,
  SqrtPriceMath,
  TICK_SPACINGS,
  TickMath,
  encodeSqrtRatioX96,
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { BIG_INT_ZERO } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { getHourlyRateData } from 'data/poolRate'
import { PoolRatesEntry } from 'data/type'
import { useActiveWeb3React } from 'hooks'
import { PoolState, usePool } from 'hooks/usePools'
import { RANGE_LIST } from 'pages/AddLiquidityV2/constants'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { AppState } from 'state/index'
import { tryParseAmount } from 'state/swap/hooks'
import { usePairFactor } from 'state/topTokens/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { getTickToPrice } from 'utils/getTickToPrice'
import { shortString } from 'utils/string'

import {
  addPosition,
  removePosition,
  resetMintState,
  setRange,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
} from './actions'
import { Bound, Field, Point, RANGE, TimeframeOptions } from './type'
import { getRangeTicks, tryParseTick } from './utils'

export function useProAmmMintState(): AppState['mintV2'] {
  return useAppSelector(state => state.mintV2)
}

export function useProAmmMintActionHandlers(
  noLiquidity: boolean | undefined,
  positionIndex: number,
): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  onStartPriceInput: (typedValue: string) => void
  onResetMintState: () => void
  onAddPosition: () => void
  onRemovePosition: (positionIndex: number) => void
} {
  const dispatch = useAppDispatch()
  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true, positionIndex }))
    },
    [dispatch, noLiquidity, positionIndex],
  )

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true, positionIndex }))
    },
    [dispatch, noLiquidity, positionIndex],
  )

  const onLeftRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeLeftRangeInput({ typedValue, positionIndex }))
    },
    [dispatch, positionIndex],
  )

  const onRightRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeRightRangeInput({ typedValue, positionIndex }))
    },
    [dispatch, positionIndex],
  )

  const onStartPriceInput = useCallback(
    (typedValue: string) => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch],
  )

  const onResetMintState = useCallback(() => {
    dispatch(resetMintState())
  }, [dispatch])

  const onAddPosition = useCallback(() => {
    dispatch(addPosition())
  }, [dispatch])

  const onRemovePosition = useCallback(
    (positionIndex: number) => {
      dispatch(removePosition({ positionIndex }))
    },
    [dispatch],
  )

  return {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
    onResetMintState,
    onAddPosition,
    onRemovePosition,
  }
}

const ENHANCED_TICK_SPACINGS: {
  [amount in FeeAmount]: number
} = {
  [FeeAmount.STABLE]: TICK_SPACINGS[FeeAmount.LOWEST] * 2,
  [FeeAmount.LOWEST]: TICK_SPACINGS[FeeAmount.LOWEST] * 2,
  [FeeAmount.LOW]: TICK_SPACINGS[FeeAmount.LOW],
  [FeeAmount.MEDIUM]: TICK_SPACINGS[FeeAmount.MEDIUM],
  [FeeAmount.HIGH]: TICK_SPACINGS[FeeAmount.HIGH] * 0.7,
}

export function useProAmmDerivedMintInfo(
  positionIndex: number,
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
  riskPoint: Point
  profitPoint: Point
  activeRange: RANGE | null
} {
  const { account } = useActiveWeb3React()
  const { positions, startPriceTypedValue } = useProAmmMintState()
  const { independentField, typedValue, leftRangeTypedValue, rightRangeTypedValue } =
    positions[positionIndex >= positions.length ? positions.length - 1 : positionIndex]
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
  const [tokenA, tokenB, baseToken]: [Token | undefined, Token | undefined, Token | undefined] = useMemo(
    () => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped],
    [currencyA, currencyB, baseCurrency],
  )

  const [token0, token1]: [Token | undefined, Token | undefined] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB],
  )
  // balances
  const balances: CurrencyAmount<Currency>[] = useCurrencyBalances(
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
  const invalidPrice: boolean = useMemo(() => {
    const sqrtRatioX96 = price ? encodeSqrtRatioX96(price.numerator, price.denominator) : undefined
    return Boolean(
      price &&
        sqrtRatioX96 &&
        !(
          JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
          JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)
        ),
    )
  }, [price])

  const currentTick = useMemo(
    () => (price && !invalidPrice ? priceToClosestTick(price) : undefined),
    [invalidPrice, price],
  )

  // used for ratio calculation when pool not initialized
  const mockPool: Pool | undefined = useMemo(() => {
    if (tokenA && tokenB && feeAmount && price && !invalidPrice && typeof currentTick === 'number') {
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
      return new Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), JSBI.BigInt(0), currentTick, [])
    } else {
      return undefined
    }
  }, [currentTick, feeAmount, invalidPrice, price, tokenA, tokenB])

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
    [bound in Bound]: number | undefined
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
  const ticksAtLimit: {
    [bound in Bound]: boolean | undefined
  } = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
      [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    }),
    [tickSpaceLimits, tickLower, tickUpper, feeAmount],
  )

  // mark invalid range
  const invalidRange: boolean = typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper

  // always returns the price with 0 as base token
  const pricesAtTicks: {
    [bound in Bound]: Price<Token, Token> | undefined
  } = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice(token0, token1, tickLower),
      [Bound.UPPER]: getTickToPrice(token0, token1, tickUpper),
    }
  }, [token0, token1, tickLower, tickUpper])
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
    typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent < tickLower,
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

  const amount0Unlock = useMemo(
    () =>
      price && noLiquidity
        ? FullMath.mulDiv(
            SqrtPriceMath.getAmount0Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
            JSBI.BigInt('105'),
            JSBI.BigInt('100'),
          )
        : JSBI.BigInt('0'),
    [noLiquidity, price],
  )

  const amount1Unlock = useMemo(
    () =>
      price && noLiquidity
        ? FullMath.mulDiv(
            SqrtPriceMath.getAmount1Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
            JSBI.BigInt('105'),
            JSBI.BigInt('100'),
          )
        : JSBI.BigInt('0'),
    [noLiquidity, price],
  )

  const currencyBalanceA = currencyBalances?.[Field.CURRENCY_A]
  const currencyBalanceB = currencyBalances?.[Field.CURRENCY_B]
  const errorMessage: ReactNode | undefined = useMemo(() => {
    if (!account) {
      return <Trans>Connect Wallet</Trans>
    }

    if (poolState === PoolState.INVALID) {
      return errorMessage ?? <Trans>Invalid pair</Trans>
    }

    if (invalidPrice) {
      return errorMessage ?? <Trans>Invalid price input</Trans>
    }
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

    if ((!currencyAAmount && !depositADisabled) || (!currencyBAmount && !depositBDisabled)) {
      return errorMessage ?? <Trans>Enter an amount</Trans>
    }

    if (
      (currencyAAmount && currencyBalanceA?.lessThan(currencyAAmount)) ||
      (noLiquidity && depositADisabled && currencyBalanceA?.equalTo(ZERO))
    ) {
      return <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>
    } else if (
      noLiquidity &&
      currencyAAmount &&
      currencyA &&
      currencyBalanceA?.lessThan(
        currencyAAmount.add(CurrencyAmount.fromRawAmount(currencyA, !invertPrice ? amount0Unlock : amount1Unlock)),
      )
    ) {
      return <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance.</Trans>
    }

    if (
      (currencyBAmount && currencyBalanceB?.lessThan(currencyBAmount)) ||
      (noLiquidity && depositBDisabled && currencyBalanceB?.equalTo(ZERO))
    ) {
      return <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance</Trans>
    } else if (
      noLiquidity &&
      currencyBAmount &&
      currencyB &&
      currencyBalanceB?.lessThan(
        currencyBAmount.add(CurrencyAmount.fromRawAmount(currencyB, !invertPrice ? amount1Unlock : amount0Unlock)),
      )
    ) {
      return <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance.</Trans>
    }

    return
  }, [
    account,
    amount0Unlock,
    amount1Unlock,
    currencies,
    currencyA,
    currencyB,
    currencyBalanceA,
    currencyBalanceB,
    depositADisabled,
    depositBDisabled,
    invalidPrice,
    invertPrice,
    noLiquidity,
    parsedAmounts,
    poolState,
  ])

  const invalidPool = poolState === PoolState.INVALID

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const R1 = 76
  const R2 = 51
  const R3 = 31
  const R4 = 16
  const pairFactor = usePairFactor([price?.baseCurrency, price?.quoteCurrency])
  const riskPoint: Point = useMemo(() => {
    if (price && priceLower && priceUpper) {
      const D1 = new Fraction(1).subtract(priceLower.divide(price))
      const D2 = priceUpper.divide(price).subtract(1)
      const D = D1.lessThan(D2) ? D1 : D2
      const R = D.divide(pairFactor).multiply(10000)
      if (R.lessThan(R4)) return 5
      if (R.lessThan(R3)) return 4
      if (R.lessThan(R2)) return 3
      if (R.lessThan(R1)) return 2
      return 1
    }
    return 0
  }, [pairFactor, price, priceLower, priceUpper])

  const profitPoint: Point = useMemo(() => {
    if (price && priceLower && priceUpper) {
      if (priceLower.lessThan(price) && price.lessThan(priceUpper)) {
        const D = new Fraction(1).subtract(priceLower.asFraction.multiply(2).divide(priceLower.add(priceUpper)))
        const R = D.divide(pairFactor).multiply(10000)
        if (R.lessThan(R4)) return 5
        if (R.lessThan(R3)) return 4
        if (R.lessThan(R2)) return 3
        if (R.lessThan(R1)) return 2
        return 1
      } else {
        return 0
      }
    }
    return 0
  }, [pairFactor, price, priceLower, priceUpper])

  const activeRange: RANGE | null = useMemo(() => {
    if (feeAmount && tokenA && tokenB && currentTick !== undefined && tickLower && tickUpper) {
      if (ticksAtLimit[Bound.LOWER] && ticksAtLimit[Bound.UPPER]) return RANGE.FULL_RANGE
      const rangeValue = RANGE_LIST.find(range => {
        if (range === RANGE.FULL_RANGE) return false
        let [rangeTickLower, rangeTickUpper] = getRangeTicks(range, tokenA, tokenB, currentTick, pairFactor)
        // if (range === RANGE.COMMON) {
        //   console.group()
        //   console.log('invertPrice', invertPrice)
        //   console.log({ currentTick })
        //   console.log({ rangeTickLower, tickLower })
        //   console.log({ rangeTickUpper, tickUpper })
        //   console.groupEnd()
        // }
        if (invertPrice) [rangeTickLower, rangeTickUpper] = [rangeTickUpper, rangeTickLower]
        if (
          Math.abs(rangeTickLower - tickLower) < ENHANCED_TICK_SPACINGS[feeAmount] &&
          Math.abs(rangeTickUpper - tickUpper) < ENHANCED_TICK_SPACINGS[feeAmount]
        )
          return true
        return false
      })
      if (rangeValue) return rangeValue
    }
    return null
  }, [currentTick, feeAmount, invertPrice, pairFactor, tickLower, tickUpper, ticksAtLimit, tokenA, tokenB])

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
    amount1Unlock,
    riskPoint,
    profitPoint,
    activeRange,
  }
}

export function useProAmmDerivedAllMintInfo(
  positionIndex: number,
  currencyA?: Currency,
  currencyB?: Currency,
  feeAmount?: FeeAmount,
  baseCurrency?: Currency,
  existingPosition?: Position,
): {
  positions: (Position | undefined)[]
  errorMessage?: ReactNode
  errorLabel?: ReactNode
  currencyAmountSum: { [field in Field]: CurrencyAmount<Currency> | undefined }
  ticksAtLimits: {
    [bound in Bound]: (boolean | undefined)[]
  }
} {
  const { account } = useActiveWeb3React()
  const { positions, startPriceTypedValue } = useProAmmMintState()
  // const { independentField, typedValue, leftRangeTypedValue, rightRangeTypedValue } = positions
  const dependentField: Field[] = positions.map(({ independentField }) =>
    independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A,
  )

  // currencies
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB],
  )
  // formatted with tokens
  const [tokenA, tokenB, baseToken]: [Token | undefined, Token | undefined, Token | undefined] = useMemo(
    () => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped],
    [currencyA, currencyB, baseCurrency],
  )

  const [token0, token1]: [Token | undefined, Token | undefined] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB],
  )
  // balances
  const balances: CurrencyAmount<Currency>[] = useCurrencyBalances(
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
  const invalidPrice: boolean = useMemo(() => {
    const sqrtRatioX96 = price ? encodeSqrtRatioX96(price.numerator, price.denominator) : undefined
    return Boolean(
      price &&
        sqrtRatioX96 &&
        !(
          JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
          JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)
        ),
    )
  }, [price])

  const currentTick = useMemo(
    () => (price && !invalidPrice ? priceToClosestTick(price) : undefined),
    [invalidPrice, price],
  )

  // used for ratio calculation when pool not initialized
  const mockPool: Pool | undefined = useMemo(() => {
    if (tokenA && tokenB && feeAmount && price && !invalidPrice && typeof currentTick === 'number') {
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
      return new Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), JSBI.BigInt(0), currentTick, [])
    } else {
      return undefined
    }
  }, [currentTick, feeAmount, invalidPrice, price, tokenA, tokenB])

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
    [bound in Bound]: (number | undefined)[]
  } = useMemo(
    () =>
      positions.reduce(
        (acc, { leftRangeTypedValue, rightRangeTypedValue }) => {
          const lower =
            typeof existingPosition?.tickLower === 'number'
              ? existingPosition.tickLower
              : (invertPrice && typeof rightRangeTypedValue === 'boolean') ||
                (!invertPrice && typeof leftRangeTypedValue === 'boolean')
              ? tickSpaceLimits[Bound.LOWER]
              : invertPrice
              ? tryParseTick(token1, token0, feeAmount, rightRangeTypedValue.toString())
              : tryParseTick(token0, token1, feeAmount, leftRangeTypedValue.toString())
          const upper =
            typeof existingPosition?.tickUpper === 'number'
              ? existingPosition.tickUpper
              : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
                (invertPrice && typeof leftRangeTypedValue === 'boolean')
              ? tickSpaceLimits[Bound.UPPER]
              : invertPrice
              ? tryParseTick(token1, token0, feeAmount, leftRangeTypedValue.toString())
              : tryParseTick(token0, token1, feeAmount, rightRangeTypedValue.toString())
          if (!acc[Bound.LOWER]) acc[Bound.LOWER] = [lower]
          else acc[Bound.LOWER]!.push(lower)
          if (!acc[Bound.UPPER]) acc[Bound.UPPER] = [upper]
          else acc[Bound.UPPER]!.push(upper)
          return acc
        },
        {
          [Bound.LOWER]: [],
          [Bound.UPPER]: [],
        } as {
          [bound in Bound]: (number | undefined)[]
        },
      ),
    [
      positions,
      existingPosition?.tickLower,
      existingPosition?.tickUpper,
      invertPrice,
      tickSpaceLimits,
      token1,
      token0,
      feeAmount,
    ],
  )

  const { [Bound.LOWER]: tickLowers, [Bound.UPPER]: tickUppers } = ticks || {}

  const invalidRange: boolean[] = positions.map(
    (_, index) =>
      typeof tickLowers[index] === 'number' &&
      typeof tickUppers[index] === 'number' &&
      tickLowers[index]! >= tickUppers[index]!,
  )

  // always returns the price with 0 as base token
  const pricesAtTicks: {
    [bound in Bound]: (Price<Token, Token> | undefined)[]
  } = useMemo(
    () =>
      positions.reduce(
        (acc, _, index) => {
          const lower = getTickToPrice(token0, token1, tickLowers[index])
          const upper = getTickToPrice(token0, token1, tickUppers[index])
          if (!acc[Bound.LOWER]) acc[Bound.LOWER] = [lower]
          else acc[Bound.LOWER]!.push(lower)
          if (!acc[Bound.UPPER]) acc[Bound.UPPER] = [upper]
          else acc[Bound.UPPER]!.push(upper)
          return acc
        },
        {
          [Bound.LOWER]: [],
          [Bound.UPPER]: [],
        } as {
          [bound in Bound]: (Price<Token, Token> | undefined)[]
        },
      ),
    [positions, tickLowers, tickUppers, token0, token1],
  )
  const { [Bound.LOWER]: lowerPrices, [Bound.UPPER]: upperPrices } = pricesAtTicks

  // amounts
  const independentAmount: (CurrencyAmount<Currency> | undefined)[] = useMemo(
    () => positions.map(({ typedValue, independentField }) => tryParseAmount(typedValue, currencies[independentField])),
    [currencies, positions],
  )

  const dependentAmount: (CurrencyAmount<Currency> | undefined)[] = useMemo(
    () =>
      positions.map((_, index) => {
        // we wrap the currencies just to get the price in terms of the other token
        const dependentCurrency = dependentField[index] === Field.CURRENCY_B ? currencyB : currencyA
        const current_independentAmount = independentAmount[index]
        const tickLower = tickLowers[index]
        const tickUpper = tickUppers[index]
        const wrappedIndependentAmount = current_independentAmount?.wrapped
        if (
          current_independentAmount &&
          wrappedIndependentAmount &&
          typeof tickLower === 'number' &&
          typeof tickUpper === 'number' &&
          poolForPosition
        ) {
          const outOfRange = Boolean(
            !invalidRange[index] &&
              price &&
              lowerPrices[index] &&
              upperPrices[index] &&
              (price.lessThan(lowerPrices[index]!) || price.greaterThan(upperPrices[index]!)),
          )

          // if price is out of range or invalid range - return 0 (single deposit will be independent)
          if (outOfRange || invalidRange[index]) {
            return undefined
          }

          const position: Position | undefined = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
            ? Position.fromAmount0({
                pool: poolForPosition,
                tickLower,
                tickUpper,
                amount0: current_independentAmount.quotient,
                useFullPrecision: true, // we want full precision for the theoretical position
              })
            : Position.fromAmount1({
                pool: poolForPosition,
                tickLower,
                tickUpper,
                amount1: current_independentAmount.quotient,
              })

          const dependentTokenAmount = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
            ? position.amount1
            : position.amount0
          return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
        }
        return undefined
      }),
    [
      positions,
      dependentField,
      currencyB,
      currencyA,
      independentAmount,
      tickLowers,
      tickUppers,
      poolForPosition,
      invalidRange,
      price,
      lowerPrices,
      upperPrices,
    ],
  )

  const parsedAmounts: { [field in Field]: (CurrencyAmount<Currency> | undefined)[] } = useMemo(
    () =>
      positions.reduce(
        (acc, { independentField }, index) => {
          const a = independentField === Field.CURRENCY_A ? independentAmount[index] : dependentAmount[index]
          const b = independentField === Field.CURRENCY_A ? dependentAmount[index] : independentAmount[index]
          if (!acc[Field.CURRENCY_A]) acc[Field.CURRENCY_A] = [a]
          else acc[Field.CURRENCY_A]!.push(a)
          if (!acc[Field.CURRENCY_B]) acc[Field.CURRENCY_B] = [b]
          else acc[Field.CURRENCY_B]!.push(b)
          return acc
        },
        {
          [Field.CURRENCY_A]: [],
          [Field.CURRENCY_B]: [],
        } as {
          [field in Field]: (CurrencyAmount<Currency> | undefined)[]
        },
      ),
    [dependentAmount, independentAmount, positions],
  )

  const amount0Unlock = useMemo(
    () =>
      price && noLiquidity
        ? FullMath.mulDiv(
            SqrtPriceMath.getAmount0Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
            JSBI.BigInt('105'),
            JSBI.BigInt('100'),
          )
        : JSBI.BigInt('0'),
    [noLiquidity, price],
  )

  const amount1Unlock = useMemo(
    () =>
      price && noLiquidity
        ? FullMath.mulDiv(
            SqrtPriceMath.getAmount1Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
            JSBI.BigInt('105'),
            JSBI.BigInt('100'),
          )
        : JSBI.BigInt('0'),
    [noLiquidity, price],
  )

  const currencyBalanceA = currencyBalances?.[Field.CURRENCY_A]
  const currencyBalanceB = currencyBalances?.[Field.CURRENCY_B]

  const { [Field.CURRENCY_A]: currencyAAmounts, [Field.CURRENCY_B]: currencyBAmounts } = parsedAmounts
  const currencyAmountSum: { [field in Field]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    let currencyAAmountSum: CurrencyAmount<Currency> | undefined
    currencyAAmounts.forEach(currencyAAmount => {
      try {
        currencyAAmountSum =
          currencyAAmount && currencyAAmountSum
            ? currencyAAmount.add(currencyAAmountSum)
            : currencyAAmount || currencyAAmountSum
      } catch {}
    })

    let currencyBAmountSum: CurrencyAmount<Currency> | undefined
    currencyBAmounts.forEach(currencyBAmount => {
      try {
        currencyBAmountSum =
          currencyBAmount && currencyBAmountSum
            ? currencyBAmount.add(currencyBAmountSum)
            : currencyBAmount || currencyBAmountSum
      } catch {}
    })
    return {
      [Field.CURRENCY_A]: currencyAAmountSum,
      [Field.CURRENCY_B]: currencyBAmountSum,
    }
  }, [currencyAAmounts, currencyBAmounts])

  const errorLabel: ReactNode | undefined = useMemo(() => {
    if (positions.length < 2) return
    const currencyAAmountSum: CurrencyAmount<Currency> | undefined = currencyAmountSum[Field.CURRENCY_A]
    if (currencyAAmountSum && currencyBalanceA?.lessThan(currencyAAmountSum)) {
      return (
        <Trans>
          The total token amount ({shortString(currencyAAmountSum.toSignificant(4), 10)}{' '}
          {currencyAAmountSum.currency.symbol}) you are trying to deposit across the {positions.length} positions is
          more than your available token balance ({currencyBalanceA.toSignificant(4)} {currencyBalanceA.currency.symbol}
          )
        </Trans>
      )
    }

    const currencyBAmountSum: CurrencyAmount<Currency> | undefined = currencyAmountSum[Field.CURRENCY_B]
    if (currencyBAmountSum && currencyBalanceB?.lessThan(currencyBAmountSum)) {
      return (
        <Trans>
          The total token amount ({shortString(currencyBAmountSum.toSignificant(4), 10)}{' '}
          {currencyBAmountSum.currency.symbol}) you are trying to deposit across the {positions.length} positions is
          more than your available token balance ({currencyBalanceB.toSignificant(4)} {currencyBalanceB.currency.symbol}
          )
        </Trans>
      )
    }

    return
  }, [currencyAmountSum, currencyBalanceA, currencyBalanceB, positions.length])

  const errorMessage: ReactNode | undefined = useMemo(() => {
    if (!account) {
      return <Trans>Connect Wallet</Trans>
    }

    if (poolState === PoolState.INVALID) {
      return <Trans>Invalid pair</Trans>
    }

    if (invalidPrice) {
      return <Trans>Invalid price input</Trans>
    }

    const errorMessages = [positionIndex, ...new Array(positions.length).fill(0).map((_, index) => index)].map(
      index => {
        const currencyAAmount = currencyAAmounts?.[index]
        const currencyBAmount = currencyBAmounts?.[index]
        const tickUpper = tickUppers[index]
        const tickLower = tickLowers[index]
        // single deposit only if price is out of range
        const deposit0Disabled = Boolean(
          // tickUppers.some
          typeof tickUpper === 'number' && poolForPosition && poolForPosition.tickCurrent >= tickUpper,
        )
        const deposit1Disabled = Boolean(
          typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent < tickLower,
        )
        // sorted for token order
        const depositADisabled =
          invalidRange[index] ||
          Boolean(
            (deposit0Disabled && poolForPosition && tokenA && poolForPosition.token0.equals(tokenA)) ||
              (deposit1Disabled && poolForPosition && tokenA && poolForPosition.token1.equals(tokenA)),
          )
        const depositBDisabled =
          invalidRange[index] ||
          Boolean(
            (deposit0Disabled && poolForPosition && tokenB && poolForPosition.token0.equals(tokenB)) ||
              (deposit1Disabled && poolForPosition && tokenB && poolForPosition.token1.equals(tokenB)),
          )

        if ((!currencyAAmount && !depositADisabled) || (!currencyBAmount && !depositBDisabled)) {
          if (positionIndex !== index) {
            return <Trans key={index}>Position {index + 1}: Enter an amount</Trans>
          } else {
            return <Trans key={index}>Enter an amount</Trans>
          }
        }

        if (
          (currencyAAmount && currencyBalanceA?.lessThan(currencyAAmount)) ||
          (noLiquidity && depositADisabled && currencyBalanceA?.equalTo(ZERO))
        ) {
          if (positionIndex !== index) {
            return (
              <Trans key={index}>
                Position {index + 1}: Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance
              </Trans>
            )
          } else {
            return <Trans key={index}>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>
          }
        } else if (
          noLiquidity &&
          currencyAAmount &&
          currencyA &&
          currencyBalanceA?.lessThan(
            currencyAAmount.add(CurrencyAmount.fromRawAmount(currencyA, !invertPrice ? amount0Unlock : amount1Unlock)),
          )
        ) {
          if (positionIndex !== index) {
            return (
              <Trans key={index}>
                Position {index + 1}: Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance.
              </Trans>
            )
          } else {
            return <Trans key={index}>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance.</Trans>
          }
        }

        if (
          (currencyBAmount && currencyBalanceB?.lessThan(currencyBAmount)) ||
          (noLiquidity && depositBDisabled && currencyBalanceB?.equalTo(ZERO))
        ) {
          if (positionIndex !== index) {
            return (
              <Trans key={index}>
                Position {index + 1}: Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance
              </Trans>
            )
          } else {
            return <Trans key={index}>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance</Trans>
          }
        } else if (
          noLiquidity &&
          currencyBAmount &&
          currencyB &&
          currencyBalanceB?.lessThan(
            currencyBAmount.add(CurrencyAmount.fromRawAmount(currencyB, !invertPrice ? amount1Unlock : amount0Unlock)),
          )
        ) {
          if (positionIndex !== index) {
            return (
              <Trans key={index}>
                Position {index + 1}: Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance.
              </Trans>
            )
          } else {
            return <Trans key={index}>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance.</Trans>
          }
        }

        return undefined
      },
    )
    const foundErrorMessage = errorMessages.find(Boolean)
    if (foundErrorMessage) return foundErrorMessage

    const currencyAAmountSum: CurrencyAmount<Currency> | undefined = currencyAmountSum[Field.CURRENCY_A]
    if (currencyAAmountSum && currencyBalanceA?.lessThan(currencyAAmountSum)) {
      return <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>
    }

    const currencyBAmountSum: CurrencyAmount<Currency> | undefined = currencyAmountSum[Field.CURRENCY_B]
    if (currencyBAmountSum && currencyBalanceB?.lessThan(currencyBAmountSum)) {
      return <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance</Trans>
    }

    return
  }, [
    account,
    amount0Unlock,
    amount1Unlock,
    currencies,
    currencyA,
    currencyAAmounts,
    currencyAmountSum,
    currencyB,
    currencyBAmounts,
    currencyBalanceA,
    currencyBalanceB,
    invalidPrice,
    invalidRange,
    invertPrice,
    noLiquidity,
    poolForPosition,
    poolState,
    positionIndex,
    positions,
    tickLowers,
    tickUppers,
    tokenA,
    tokenB,
  ])

  const positionsFormatted: (Position | undefined)[] = useMemo(
    () =>
      positions.map((_, index) => {
        const tickUpper = tickUppers[index]
        const tickLower = tickLowers[index]
        const currentParsedAmounts = {
          [Field.CURRENCY_A]: parsedAmounts?.[Field.CURRENCY_A][index],
          [Field.CURRENCY_B]: parsedAmounts?.[Field.CURRENCY_B][index],
        }
        const deposit0Disabled = Boolean(
          typeof tickUpper === 'number' && poolForPosition && poolForPosition.tickCurrent >= tickUpper,
        )
        const deposit1Disabled = Boolean(
          typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent < tickLower,
        )

        if (
          !poolForPosition ||
          !tokenA ||
          !tokenB ||
          typeof tickLower !== 'number' ||
          typeof tickUpper !== 'number' ||
          invalidRange[index]
        ) {
          return undefined
        }
        // mark as 0 if disabled because out of range
        const amount0 = !deposit0Disabled
          ? currentParsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]
              ?.quotient
          : BIG_INT_ZERO
        const amount1 = !deposit1Disabled
          ? currentParsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]
              ?.quotient
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
      }),
    [positions, tickUppers, tickLowers, parsedAmounts, poolForPosition, tokenA, tokenB, invalidRange],
  )

  const ticksAtLimits: {
    [bound in Bound]: (boolean | undefined)[]
  } = useMemo(
    () => ({
      [Bound.LOWER]: tickLowers.map(tickLower => feeAmount && tickLower === tickSpaceLimits.LOWER),
      [Bound.UPPER]: tickUppers.map(tickUpper => feeAmount && tickUpper === tickSpaceLimits.UPPER),
    }),
    [tickSpaceLimits, tickLowers, tickUppers, feeAmount],
  )

  return {
    positions: positionsFormatted,
    errorMessage,
    errorLabel,
    currencyAmountSum,
    ticksAtLimits,
  }
}

export function useRangeHopCallbacks(
  baseCurrency: Currency | undefined,
  quoteCurrency: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  tickLower: number | undefined,
  tickUpper: number | undefined,
  positionIndex: number,
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

  const pairFactor = usePairFactor([baseToken, quoteToken])
  const getSetRange = useCallback(
    (range: RANGE) => {
      if (range === RANGE.FULL_RANGE) {
        dispatch(setRange({ leftRangeTypedValue: true, rightRangeTypedValue: true, positionIndex }))
      } else if (initTick !== undefined && baseToken && quoteToken && feeAmount) {
        const [tickLower, tickUpper] = getRangeTicks(range, baseToken, quoteToken, initTick, pairFactor)

        const parsedLower = tickToPrice(baseToken, quoteToken, tickLower)
        const parsedUpper = tickToPrice(baseToken, quoteToken, tickUpper)

        const result = {
          leftRangeTypedValue: parsedLower.toSignificant(18),
          rightRangeTypedValue: parsedUpper.toSignificant(18),
          positionIndex,
        }
        dispatch(setRange(result))
      }
    },
    [initTick, baseToken, quoteToken, feeAmount, dispatch, positionIndex, pairFactor],
  )

  return { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetRange }
}

export function useHourlyRateData(
  poolAddress: string | undefined,
  timeWindow: TimeframeOptions,
): [PoolRatesEntry[], PoolRatesEntry[]] | null {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const [ratesData, setRatesData] = useState<[PoolRatesEntry[], PoolRatesEntry[]] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const currentTime = dayjs.utc()
    let startTime: number

    switch (timeWindow) {
      case TimeframeOptions.FOUR_HOURS:
        startTime = currentTime.subtract(4, 'hour').startOf('second').unix()
        break
      case TimeframeOptions.ONE_DAY:
        startTime = currentTime.subtract(1, 'day').startOf('minute').unix()
        break
      case TimeframeOptions.THERE_DAYS:
        startTime = currentTime.subtract(3, 'day').startOf('hour').unix()
        break
      case TimeframeOptions.WEEK:
        startTime = currentTime.subtract(1, 'week').startOf('hour').unix()
        break
      case TimeframeOptions.MONTH:
        startTime = currentTime.subtract(1, 'month').startOf('hour').unix()
        break
      default:
        startTime = currentTime.subtract(3, 'day').startOf('hour').unix()
        break
    }

    async function fetch() {
      const frequency =
        timeWindow === TimeframeOptions.FOUR_HOURS
          ? 30
          : timeWindow === TimeframeOptions.ONE_DAY
          ? 120
          : timeWindow === TimeframeOptions.THERE_DAYS
          ? 300
          : 3600

      if (isEVM(chainId) && poolAddress) {
        setRatesData(null)
        const ratesData = await getHourlyRateData(
          poolAddress,
          startTime,
          frequency,
          NETWORKS_INFO[chainId],
          controller.signal,
        )
        !controller.signal.aborted && ratesData && setRatesData(ratesData)
      }
    }
    fetch()
    return () => controller.abort()
  }, [timeWindow, poolAddress, dispatch, chainId])

  return ratesData
}
