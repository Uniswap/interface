import { BIG_INT_ZERO } from './../../constants/index'
import { getTickToPrice } from 'utils/getTickToPrice'
import JSBI from 'jsbi'
import { PoolState } from '../../hooks/usePools'
import { Pool, FeeAmount, Position, priceToClosestTick, TickMath } from '@uniswap/v3-sdk/dist/'
import { Currency, CurrencyAmount, ETHER, Price } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrency, wrappedCurrencyAmount } from '../../utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, Bound, typeInput, typeLowerRangeInput, typeUpperRangeInput, typeStartPriceInput } from './actions'
import { tryParseTick } from './utils'
import { usePool } from 'hooks/usePools'

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>((state) => state.mint)
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined
): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  onLowerRangeInput: (typedValue: string) => void
  onUpperRangeInput: (typedValue: string) => void
  onStartPriceInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  const onLowerRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeLowerRangeInput({ typedValue }))
    },
    [dispatch]
  )

  const onUpperRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeUpperRangeInput({ typedValue }))
    },
    [dispatch]
  )

  const onStartPriceInput = useCallback(
    (typedValue: string) => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch]
  )

  return {
    onFieldAInput,
    onFieldBInput,
    onLowerRangeInput,
    onUpperRangeInput,
    onStartPriceInput,
  }
}

export function useDerivedMintInfo(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  // override for existing position
  existingPosition?: Position | undefined
): {
  pool?: Pool | null
  poolState: PoolState
  ticks: { [bound in Bound]?: number | undefined }
  price?: Price
  pricesAtTicks: {
    [bound in Bound]?: Price | undefined
  }
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  dependentField: Field
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  position: Position | undefined
  noLiquidity?: boolean
  errorMessage?: string
  invalidPool: boolean
  outOfRange: boolean
  invalidRange: boolean
  depositADisabled: boolean
  depositBDisabled: boolean
} {
  const { account, chainId } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    lowerRangeTypedValue,
    upperRangeTypedValue,
    startPriceTypedValue,
  } = useMintState()

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // currencies
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB]
  )

  // formatted with tokens
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    chainId,
    currencyA,
    currencyB,
  ])

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [
    currencies[Field.CURRENCY_A],
    currencies[Field.CURRENCY_B],
  ])

  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1],
  }

  // pool
  const [poolState, pool] = usePool(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B], feeAmount)
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  const price = useMemo(() => {
    // if no liquidity use typed value
    if (noLiquidity) {
      const parsedAmount = tryParseAmount(startPriceTypedValue, tokenB)
      if (parsedAmount && tokenA && tokenB) {
        const amountOne = tryParseAmount('1', tokenA)
        return amountOne ? new Price(tokenA, tokenB, amountOne.raw, parsedAmount.raw) : undefined
      }
      return undefined
    } else {
      // get the amount of quote currency
      return pool && tokenA ? pool.priceOf(tokenA) : undefined
    }
  }, [noLiquidity, startPriceTypedValue, tokenA, tokenB, pool])

  // used for ratio calculation when pool not initialized
  const mockPool = useMemo(() => {
    if (tokenA && tokenB && feeAmount && price) {
      const currentTick = priceToClosestTick(price)
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
      return new Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), currentTick, [])
    } else {
      return undefined
    }
  }, [feeAmount, price, tokenA, tokenB])

  // if pool exists use it, if not use the mock pool
  const poolForPosition: Pool | undefined = pool ?? mockPool

  // parse typed range values and determine closest ticks
  const ticks: {
    [key: string]: number | undefined
  } = useMemo(() => {
    return {
      [Bound.LOWER]: existingPosition
        ? existingPosition.tickLower
        : tryParseTick(tokenA, tokenB, feeAmount, lowerRangeTypedValue),
      [Bound.UPPER]: existingPosition
        ? existingPosition.tickUpper
        : tryParseTick(tokenA, tokenB, feeAmount, upperRangeTypedValue),
    }
  }, [existingPosition, feeAmount, lowerRangeTypedValue, tokenA, tokenB, upperRangeTypedValue])

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks || {}
  const sortedTicks = useMemo(
    () =>
      tickLower !== undefined && tickUpper !== undefined
        ? tickLower < tickUpper
          ? [tickLower, tickUpper]
          : [tickUpper, tickLower]
        : undefined,
    [tickLower, tickUpper]
  )

  const pricesAtTicks = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice(tokenA, tokenB, ticks[Bound.LOWER]),
      [Bound.UPPER]: getTickToPrice(tokenA, tokenB, ticks[Bound.UPPER]),
    }
  }, [tokenA, tokenB, ticks])
  const { [Bound.LOWER]: lowerPrice, [Bound.UPPER]: upperPrice } = pricesAtTicks

  // mark invalid range
  const invalidRange = Boolean(lowerPrice && upperPrice && lowerPrice.greaterThan(upperPrice))

  // amounts
  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])

  const dependentAmount: CurrencyAmount | undefined = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = wrappedCurrencyAmount(independentAmount, chainId)

    const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA

    if (
      feeAmount &&
      independentAmount &&
      tokenA &&
      tokenB &&
      wrappedIndependentAmount &&
      price &&
      lowerPrice &&
      upperPrice &&
      sortedTicks &&
      poolForPosition
    ) {
      // if price is out of range or invalid range - retun 0 (single deposit with be independent)
      if (price.lessThan(lowerPrice) || price.greaterThan(upperPrice) || invalidRange) {
        return undefined
      }

      const position: Position | undefined = wrappedIndependentAmount.token.equals(poolForPosition.token0)
        ? Position.fromAmount0({
            pool: poolForPosition,
            tickLower: sortedTicks[0],
            tickUpper: sortedTicks[1],
            amount0: independentAmount.raw,
          })
        : Position.fromAmount1({
            pool: poolForPosition,
            tickLower: sortedTicks[0],
            tickUpper: sortedTicks[1],
            amount1: independentAmount.raw,
          })

      const dependentTokenAmount = wrappedIndependentAmount.token.equals(poolForPosition.token0)
        ? position.amount1
        : position.amount0
      return dependentCurrency === ETHER ? CurrencyAmount.ether(dependentTokenAmount.raw) : dependentTokenAmount
    }

    return undefined
  }, [
    independentAmount,
    chainId,
    dependentField,
    currencyB,
    currencyA,
    feeAmount,
    tokenA,
    tokenB,
    price,
    sortedTicks,
    lowerPrice,
    upperPrice,
    poolForPosition,
    invalidRange,
  ])

  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, independentField])

  // single deposit only if price is out of range
  const deposit1Disabled = Boolean(sortedTicks && poolForPosition && poolForPosition.tickCurrent <= sortedTicks[0])
  const deposit0Disabled = Boolean(sortedTicks && poolForPosition && poolForPosition.tickCurrent >= sortedTicks[1])

  // sorted for token order
  const depositADisabled = Boolean(
    (deposit0Disabled && poolForPosition && tokenA && poolForPosition.token0.equals(tokenA)) ||
      (deposit1Disabled && poolForPosition && tokenA && poolForPosition.token1.equals(tokenA))
  )
  const depositBDisabled = Boolean(
    (deposit0Disabled && poolForPosition && tokenB && poolForPosition.token0.equals(tokenB)) ||
      (deposit1Disabled && poolForPosition && tokenB && poolForPosition.token1.equals(tokenB))
  )

  // create position entity based on users selection
  const position: Position | undefined = useMemo(() => {
    if (!poolForPosition || !tokenA || !tokenB || !sortedTicks) {
      return undefined
    }

    // mark as 0 if disbaled because out of range
    const amount0 = !deposit0Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.raw
      : BIG_INT_ZERO
    const amount1 = !deposit1Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.raw
      : BIG_INT_ZERO

    if (amount0 !== undefined && amount1 !== undefined) {
      return Position.fromAmounts({
        pool: poolForPosition,
        tickLower: sortedTicks[0],
        tickUpper: sortedTicks[1],
        amount0: amount0,
        amount1: amount1,
      })
    } else {
      return undefined
    }
  }, [parsedAmounts, poolForPosition, sortedTicks, tokenA, tokenB, deposit0Disabled, deposit1Disabled])

  // liquiidty range warning
  const outOfRange = Boolean(
    price &&
      lowerPrice &&
      upperPrice &&
      !invalidRange &&
      (lowerPrice.greaterThan(price) || price.greaterThan(upperPrice))
  )

  let errorMessage: string | undefined
  if (!account) {
    errorMessage = 'Connect Wallet'
  }

  if (poolState === PoolState.INVALID) {
    errorMessage = errorMessage ?? 'Invalid pair'
  }

  if (
    (!parsedAmounts[Field.CURRENCY_A] && !depositADisabled) ||
    (!parsedAmounts[Field.CURRENCY_B] && !depositBDisabled)
  ) {
    errorMessage = errorMessage ?? 'Enter an amount'
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    errorMessage = 'Insufficient ' + currencies[Field.CURRENCY_A]?.symbol + ' balance'
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    errorMessage = 'Insufficient ' + currencies[Field.CURRENCY_B]?.symbol + ' balance'
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
  }
}
