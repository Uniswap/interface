/* eslint-disable max-lines */
import { Currency, CurrencyAmount, Price, Rounding, Token } from '@uniswap/sdk-core'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  Position,
  priceToClosestTick,
  TICK_SPACINGS,
  TickMath,
  tickToPrice as tickToPriceV3,
  Pool as V3Pool,
} from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4, Pool as V4Pool } from '@uniswap/v4-sdk'
import { FeeData } from 'components/Liquidity/Create/types'
import { BIG_INT_ZERO } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { PoolState, usePool } from 'hooks/usePools'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ReactNode, useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useCurrencyBalances } from 'state/connection/hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import {
  Bound,
  Field,
  setFullRange,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
} from 'state/mint/v3/actions'
import { tryParseTick } from 'state/mint/v3/utils'
import { InterfaceState } from 'state/webReducer'
import { getTickToPrice } from 'utils/getTickToPrice'

function useV3MintState(): InterfaceState['mintV3'] {
  return useAppSelector((state) => state.mintV3)
}

export function useV3MintActionHandlers(noLiquidity: boolean | undefined): {
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

  const [searchParams, setSearchParams] = useSearchParams()

  const onLeftRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeLeftRangeInput({ typedValue }))
      const paramMinPrice = searchParams.get('minPrice')
      if (!paramMinPrice || (paramMinPrice && paramMinPrice !== typedValue)) {
        searchParams.set('minPrice', typedValue)
        setSearchParams(searchParams)
      }
    },
    [dispatch, searchParams, setSearchParams],
  )

  const onRightRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeRightRangeInput({ typedValue }))
      const paramMaxPrice = searchParams.get('maxPrice')
      if (!paramMaxPrice || (paramMaxPrice && paramMaxPrice !== typedValue)) {
        searchParams.set('maxPrice', typedValue)
        setSearchParams(searchParams)
      }
    },
    [dispatch, searchParams, setSearchParams],
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

export function useV3DerivedMintInfo({
  currencyA,
  currencyB,
  feeAmount,
  baseCurrency,
  existingPosition,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
  baseCurrency?: Currency
  // override for existing position
  existingPosition?: Position
}): {
  pool?: V3Pool | null
  poolState: PoolState
  ticks: { [bound in Bound]?: number | undefined }
  price?: Price<Token, Token>
  pricesAtTicks: {
    [bound in Bound]?: Price<Token, Token> | undefined
  }
  pricesAtLimit: {
    [bound in Bound]?: Price<Token, Token> | undefined
  }
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  dependentField: Field
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  position?: Position
  noLiquidity?: boolean
  errorMessage?: ReactNode
  invalidPool: boolean
  outOfRange: boolean
  invalidRange: boolean
  depositADisabled: boolean
  depositBDisabled: boolean
  invertPrice: boolean
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  isTaxed: boolean
} {
  const { t } = useTranslation()
  const account = useAccount()

  const { independentField, typedValue, leftRangeTypedValue, rightRangeTypedValue, startPriceTypedValue } =
    useV3MintState()

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
  const [tokenA, tokenB, baseToken] = useMemo(
    () => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped],
    [currencyA, currencyB, baseCurrency],
  )

  const [token0, token1]: [Token | undefined, Token | undefined] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB],
  )

  // balances
  const balances = useCurrencyBalances(
    account.address,
    useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]),
  )
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1],
  }

  // pool
  const [poolState, pool] = usePool({
    currencyA: currencies[Field.CURRENCY_A],
    currencyB: currencies[Field.CURRENCY_B],
    feeAmount,
  })
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  // note to parse inputs in reverse
  const invertPrice = Boolean(baseToken && token0 && !baseToken.equals(token0))

  // always returns the price with 0 as base token
  const price: Price<Token, Token> | undefined = useMemo(() => {
    // if no liquidity use typed value
    if (noLiquidity) {
      const parsedQuoteAmount = tryParseCurrencyAmount(startPriceTypedValue, invertPrice ? token0 : token1)
      if (parsedQuoteAmount && token0 && token1) {
        const baseAmount = tryParseCurrencyAmount('1', invertPrice ? token1 : token0)
        const price = baseAmount
          ? new Price(baseAmount.currency, parsedQuoteAmount.currency, baseAmount.quotient, parsedQuoteAmount.quotient)
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
      return new V3Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), currentTick, [])
    } else {
      return undefined
    }
  }, [feeAmount, invalidPrice, price, tokenA, tokenB])

  // if pool exists use it, if not use the mock pool
  const poolForPosition: V3Pool | undefined = pool ?? mockPool

  // lower and upper limits in the tick space for `feeAmount`
  const tickSpaceLimits = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]) : undefined,
      [Bound.UPPER]: feeAmount ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]) : undefined,
    }),
    [feeAmount],
  )

  // parse typed range values and determine closest ticks
  // lower should always be a smaller tick
  const ticks = useMemo(() => {
    return {
      [Bound.LOWER]:
        typeof existingPosition?.tickLower === 'number'
          ? existingPosition.tickLower
          : (invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (!invertPrice && typeof leftRangeTypedValue === 'boolean')
            ? tickSpaceLimits[Bound.LOWER]
            : invertPrice
              ? tryParseTick({
                  baseToken: token1,
                  quoteToken: token0,
                  feeAmount,
                  value: rightRangeTypedValue.toString(),
                })
              : tryParseTick({
                  baseToken: token0,
                  quoteToken: token1,
                  feeAmount,
                  value: leftRangeTypedValue.toString(),
                }),
      [Bound.UPPER]:
        typeof existingPosition?.tickUpper === 'number'
          ? existingPosition.tickUpper
          : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (invertPrice && typeof leftRangeTypedValue === 'boolean')
            ? tickSpaceLimits[Bound.UPPER]
            : invertPrice
              ? tryParseTick({
                  baseToken: token1,
                  quoteToken: token0,
                  feeAmount,
                  value: leftRangeTypedValue.toString(),
                })
              : tryParseTick({
                  baseToken: token0,
                  quoteToken: token1,
                  feeAmount,
                  value: rightRangeTypedValue.toString(),
                }),
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

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks

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

  const pricesAtLimit = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice({ baseToken: token0, quoteToken: token1, tick: tickSpaceLimits.LOWER }),
      [Bound.UPPER]: getTickToPrice({ baseToken: token0, quoteToken: token1, tick: tickSpaceLimits.UPPER }),
    }
  }, [token0, token1, tickSpaceLimits.LOWER, tickSpaceLimits.UPPER])

  // always returns the price with 0 as base token
  const pricesAtTicks = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice({ baseToken: token0, quoteToken: token1, tick: ticks[Bound.LOWER] }),
      [Bound.UPPER]: getTickToPrice({ baseToken: token0, quoteToken: token1, tick: ticks[Bound.UPPER] }),
    }
  }, [token0, token1, ticks])
  const { [Bound.LOWER]: lowerPrice, [Bound.UPPER]: upperPrice } = pricesAtTicks

  // liquidity range warning
  const outOfRange = Boolean(
    !invalidRange && price && lowerPrice && upperPrice && (price.lessThan(lowerPrice) || price.greaterThan(upperPrice)),
  )

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseCurrencyAmount(
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

  const { inputTax: currencyATax, outputTax: currencyBTax } = useSwapTaxes({
    inputTokenAddress: currencyA?.isToken ? currencyA.address : undefined,
    outputTokenAddress: currencyB?.isToken ? currencyB.address : undefined,
    tokenChainId: account.chainId,
  })

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
      ? parsedAmounts[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
      : BIG_INT_ZERO
    const amount1 = !deposit1Disabled
      ? parsedAmounts[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient
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

  let errorMessage: ReactNode | undefined
  if (!account.isConnected) {
    errorMessage = t('common.connectWallet.button')
  }

  if (poolState === PoolState.INVALID) {
    errorMessage = errorMessage ?? <Trans i18nKey="common.invalidPair" />
  }

  if (invalidPrice) {
    errorMessage = errorMessage ?? <Trans i18nKey="mint.v3.input.invalidPrice.error" />
  }

  if (
    (!parsedAmounts[Field.CURRENCY_A] && !depositADisabled) ||
    (!parsedAmounts[Field.CURRENCY_B] && !depositBDisabled)
  ) {
    errorMessage = errorMessage ?? <Trans i18nKey="common.noAmount.error" />
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    errorMessage = (
      <Trans
        i18nKey="common.insufficientTokenBalance.error"
        values={{
          tokenSymbol: currencies[Field.CURRENCY_A]?.symbol,
        }}
      />
    )
  }

  if (currencyBAmount && currencyBalances[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    errorMessage = (
      <Trans
        i18nKey="common.insufficientTokenBalance.error"
        values={{
          tokenSymbol: currencies[Field.CURRENCY_B]?.symbol,
        }}
      />
    )
  }

  const isTaxed = currencyATax.greaterThan(0) || currencyBTax.greaterThan(0)
  const invalidPool = poolState === PoolState.INVALID || isTaxed

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
    pricesAtLimit,
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
    isTaxed,
  }
}

type BaseUseRangeHopCallbacksProps = {
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  tickLower?: Maybe<number>
  tickUpper?: Maybe<number>
}

type V3UseRangeHopCallbacksProps = BaseUseRangeHopCallbacksProps & {
  feeAmount?: FeeAmount
  pool?: V3Pool | null
}

type V4UseRangeHopCallbacksProps = BaseUseRangeHopCallbacksProps & {
  fee?: FeeData
  pool?: V4Pool
}

export function useRangeHopCallbacks(props: V3UseRangeHopCallbacksProps | V4UseRangeHopCallbacksProps) {
  const { baseCurrency, quoteCurrency, tickLower, tickUpper, pool } = props
  let tickSpacing: number | undefined
  let feeAmount: FeeAmount | number | undefined

  if ('feeAmount' in props) {
    feeAmount = props.feeAmount
    tickSpacing = props.feeAmount ? TICK_SPACINGS[props.feeAmount] : undefined
  } else if ('fee' in props) {
    feeAmount = props.fee?.feeAmount
    tickSpacing = props.fee?.tickSpacing
  }

  const dispatch = useAppDispatch()

  const baseToken = useMemo(() => baseCurrency?.wrapped, [baseCurrency])
  const quoteToken = useMemo(() => quoteCurrency?.wrapped, [quoteCurrency])

  const tickToPrice = useCallback(
    (tick: number) => {
      if ('feeAmount' in props) {
        if (!baseToken || !quoteToken) {
          return ''
        }

        const newPrice = tickToPriceV3(baseToken, quoteToken, tick)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }

      if (!baseCurrency || !quoteCurrency) {
        return ''
      }

      const newPrice = tickToPriceV4(baseCurrency, quoteCurrency, tick)
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    },
    [baseCurrency, baseToken, props, quoteCurrency, quoteToken],
  )

  const getDecrementLower = useCallback(() => {
    if (typeof tickLower === 'number' && feeAmount && tickSpacing) {
      return tickToPrice(tickLower - tickSpacing)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickLower === 'number') && feeAmount && pool && tickSpacing) {
      return tickToPrice(pool.tickCurrent - tickSpacing)
    }
    return ''
  }, [tickLower, feeAmount, tickSpacing, pool, tickToPrice])

  const getIncrementLower = useCallback(() => {
    if (typeof tickLower === 'number' && feeAmount && tickSpacing) {
      return tickToPrice(tickLower + tickSpacing)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickLower === 'number') && feeAmount && pool && tickSpacing) {
      return tickToPrice(pool.tickCurrent + tickSpacing)
    }
    return ''
  }, [tickLower, feeAmount, tickSpacing, pool, tickToPrice])

  const getDecrementUpper = useCallback(() => {
    if (typeof tickUpper === 'number' && feeAmount && tickSpacing) {
      return tickToPrice(tickUpper - tickSpacing)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickUpper === 'number') && feeAmount && pool && tickSpacing) {
      return tickToPrice(pool.tickCurrent - tickSpacing)
    }
    return ''
  }, [tickUpper, feeAmount, tickSpacing, pool, tickToPrice])

  const getIncrementUpper = useCallback(() => {
    if (typeof tickUpper === 'number' && feeAmount && tickSpacing) {
      return tickToPrice(tickUpper + tickSpacing)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickUpper === 'number') && feeAmount && pool && tickSpacing) {
      return tickToPrice(pool.tickCurrent + tickSpacing)
    }
    return ''
  }, [tickUpper, feeAmount, tickSpacing, pool, tickToPrice])

  const getSetFullRange = useCallback(() => {
    dispatch(setFullRange())
  }, [dispatch])

  return { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange }
}
