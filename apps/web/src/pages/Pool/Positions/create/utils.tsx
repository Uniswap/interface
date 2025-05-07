import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price, Token, V3_CORE_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import {
  FeeAmount,
  TickMath,
  Pool as V3Pool,
  Position as V3Position,
  encodeSqrtRatioX96,
  nearestUsableTick,
  priceToClosestTick as priceToClosestV3Tick,
} from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position, priceToClosestTick as priceToClosestV4Tick } from '@uniswap/v4-sdk'
import { DepositInfo } from 'components/Liquidity/types'
import { getProtocolItems } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { PoolCache } from 'hooks/usePools'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  FeeData,
  OptionalCurrency,
  OptionalCurrencyPrice,
  OptionalNumber,
  PositionState,
  PriceDifference,
  PriceRangeInfo,
  PriceRangeState,
  V2PriceRangeInfo,
  V3PriceRangeInfo,
  V4PriceRangeInfo,
} from 'pages/Pool/Positions/create/types'
import { tryParsePrice, tryParseTick } from 'state/mint/v3/utils'
import { PositionField } from 'types/position'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  IndependentToken,
} from 'uniswap/src/data/tradingApi/__generated__'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { CreatePositionTxAndGasInfo, LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'
import { getTickToPrice, getV4TickToPrice } from 'utils/getTickToPrice'

type OptionalToken = Token | undefined
export function getSortedCurrenciesTuple(a: Token, b: Token): [Token, Token]
export function getSortedCurrenciesTuple(a: OptionalToken, b: OptionalToken): [OptionalToken, OptionalToken]
export function getSortedCurrenciesTuple(a: OptionalCurrency, b: OptionalCurrency): [OptionalCurrency, OptionalCurrency]
export function getSortedCurrenciesTuple(
  a: OptionalCurrency,
  b: OptionalCurrency,
): [OptionalCurrency, OptionalCurrency] {
  if (a?.isNative || !b) {
    return [a, b]
  }

  if (b?.isNative || !a) {
    return [b, a]
  }

  return a.sortsBefore(b) ? [a, b] : [b, a]
}

export function getSortedCurrenciesTupleWithWrap(
  a: Currency,
  b: Currency,
  protocolVersion: ProtocolVersion,
): [Currency, Currency]
export function getSortedCurrenciesTupleWithWrap(
  a: OptionalCurrency,
  b: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): [OptionalCurrency, OptionalCurrency]
export function getSortedCurrenciesTupleWithWrap(
  a: OptionalCurrency,
  b: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): [OptionalCurrency, OptionalCurrency] {
  return getSortedCurrenciesTuple(getCurrencyWithWrap(a, protocolVersion), getCurrencyWithWrap(b, protocolVersion))
}

export function getCurrencyForProtocol(
  currency: Currency,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token
export function getCurrencyForProtocol(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token | undefined
export function getCurrencyForProtocol(currency: Currency, protocolVersion: ProtocolVersion.V4): Currency
export function getCurrencyForProtocol(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion.V4,
): OptionalCurrency
export function getCurrencyForProtocol(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion.UNSPECIFIED | ProtocolVersion.V2 | ProtocolVersion.V3 | ProtocolVersion.V4,
): OptionalCurrency
/**
 * Gets the currency or token that each protocol expects. For v2 + v3 if the native currency is passed then we return the wrapped version.
 * For v4 is a wrapped native token is passed then we return the native currency.
 */
export function getCurrencyForProtocol(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): Currency | Token | undefined {
  if (!currency) {
    return undefined
  }

  if (protocolVersion === ProtocolVersion.V4) {
    const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency.chainId]
    if (areCurrenciesEqual(wrappedNative, currency)) {
      return nativeOnChain(currency.chainId)
    }

    return currency
  }

  if (currency.isToken) {
    return currency
  }

  return currency.wrapped
}

export function getCurrencyWithWrap(currency: Currency, protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3): Token
export function getCurrencyWithWrap(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token | undefined
export function getCurrencyWithWrap(currency: Currency, protocolVersion: ProtocolVersion.V4): Currency
export function getCurrencyWithWrap(currency: OptionalCurrency, protocolVersion: ProtocolVersion.V4): OptionalCurrency
export function getCurrencyWithWrap(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion.UNSPECIFIED | ProtocolVersion.V2 | ProtocolVersion.V3 | ProtocolVersion.V4,
): OptionalCurrency
export function getCurrencyWithWrap(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): Currency | Token | undefined {
  if (protocolVersion === ProtocolVersion.V4 || currency?.isToken) {
    return currency
  }

  return currency?.wrapped
}

export function getCurrencyAddressWithWrap(currency: Currency, protocolVersion: ProtocolVersion): string
export function getCurrencyAddressWithWrap(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): string | undefined
export function getCurrencyAddressWithWrap(
  currency: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): string | undefined {
  if (currency?.isToken) {
    return currency.address
  }

  if (protocolVersion === ProtocolVersion.V4) {
    return ZERO_ADDRESS
  }

  return currency?.wrapped.address
}

export function getCurrencyAddressForTradingApi(currency: Currency): string
export function getCurrencyAddressForTradingApi(currency: OptionalCurrency): string
export function getCurrencyAddressForTradingApi(currency: OptionalCurrency): string {
  return currency?.isToken ? currency.address : ZERO_ADDRESS
}

export function poolEnabledProtocolVersion(
  protocolVersion: ProtocolVersion,
): protocolVersion is ProtocolVersion.V3 | ProtocolVersion.V4 {
  return protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
}

export function pairEnabledProtocolVersion(protocolVersion: ProtocolVersion): protocolVersion is ProtocolVersion.V2 {
  return protocolVersion === ProtocolVersion.V2
}

export function validateCurrencyInput(currencies: [OptionalToken, OptionalToken]): currencies is [Token, Token]
export function validateCurrencyInput(
  currencies: [OptionalCurrency, OptionalCurrency],
): currencies is [Currency, Currency]
export function validateCurrencyInput(
  currencies: [OptionalCurrency, OptionalCurrency],
): currencies is [Currency, Currency] {
  return !!currencies[0] && !!currencies[1]
}

export function getPairFromPositionStateAndRangeState({
  derivedPositionInfo,
  derivedPriceRangeInfo,
}: {
  derivedPositionInfo: CreatePositionInfo
  derivedPriceRangeInfo: PriceRangeInfo
}): Pair | undefined {
  if (derivedPositionInfo.creatingPoolOrPair) {
    return derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2 ? derivedPriceRangeInfo.mockPair : undefined
  }

  return derivedPositionInfo.protocolVersion === ProtocolVersion.V2 ? derivedPositionInfo.pair : undefined
}

/** Attempts to return a pool from the position state. If no pool is found it returns the range state's mocked pool. */
export function getPoolFromPositionStateAndRangeState({
  derivedPositionInfo,
  derivedPriceRangeInfo,
}: {
  derivedPositionInfo: CreatePositionInfo
  derivedPriceRangeInfo: V3PriceRangeInfo
}): V3Pool | undefined
export function getPoolFromPositionStateAndRangeState({
  derivedPositionInfo,
  derivedPriceRangeInfo,
}: {
  derivedPositionInfo: CreatePositionInfo
  derivedPriceRangeInfo: V4PriceRangeInfo
}): V4Pool | undefined
export function getPoolFromPositionStateAndRangeState({
  derivedPositionInfo,
  derivedPriceRangeInfo,
}: {
  derivedPositionInfo: CreatePositionInfo
  derivedPriceRangeInfo: PriceRangeInfo
}): V3Pool | V4Pool | undefined {
  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    return undefined
  }

  if (derivedPositionInfo.creatingPoolOrPair) {
    if (
      derivedPositionInfo.protocolVersion === derivedPriceRangeInfo.protocolVersion &&
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V4
    ) {
      return derivedPriceRangeInfo.mockPool
    }

    if (
      derivedPositionInfo.protocolVersion === derivedPriceRangeInfo.protocolVersion &&
      derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V3
    ) {
      return derivedPriceRangeInfo.mockPool
    }

    return undefined
  }

  if (
    derivedPositionInfo.protocolVersion === derivedPriceRangeInfo.protocolVersion &&
    derivedPositionInfo.protocolVersion === ProtocolVersion.V4
  ) {
    return derivedPositionInfo.pool
  }

  if (
    derivedPositionInfo.protocolVersion === derivedPriceRangeInfo.protocolVersion &&
    derivedPositionInfo.protocolVersion === ProtocolVersion.V3
  ) {
    return derivedPositionInfo.pool
  }

  return undefined
}

export function getInvertedTuple<T extends OptionalCurrency>(tuple: [T, T], inverted: boolean): [T, T] {
  return inverted ? [tuple[1], tuple[0]] : tuple
}

function getPrices<T extends Currency>({
  baseCurrency,
  quoteCurrency,
  pricesAtLimit,
  pricesAtTicks,
  state,
}: {
  baseCurrency?: T
  quoteCurrency?: T
  pricesAtLimit: (Price<T, T> | undefined)[]
  pricesAtTicks: (Price<T, T> | undefined)[]
  state: PriceRangeState
}): [OptionalCurrencyPrice, OptionalCurrencyPrice] {
  if (!baseCurrency || !quoteCurrency) {
    return [undefined, undefined]
  }

  const lowerPrice = state.fullRange ? pricesAtLimit[0] : pricesAtTicks[0]
  const upperPrice = state.fullRange ? pricesAtLimit[1] : pricesAtTicks[1]

  return [lowerPrice, upperPrice]
}

/**
 * Pools and Pairs in all protocol versions require that [currency0, currency1] be sorted.
 * So, if the user-provided initial price is inverted w.r.t. the sorted order, we need to invert it again here.
 */
function getInitialPrice({
  baseCurrency,
  sortedCurrencies,
  initialPrice,
}: {
  baseCurrency: OptionalCurrency
  sortedCurrencies: [OptionalCurrency, OptionalCurrency]
  initialPrice: string
}) {
  const [currency0, currency1] = sortedCurrencies
  const invertPrice = Boolean(baseCurrency && currency0 && !baseCurrency.equals(currency0))

  const parsedQuoteAmount = tryParseCurrencyAmount(initialPrice, invertPrice ? currency0 : currency1)
  if (!parsedQuoteAmount) {
    return undefined
  }

  const baseAmount = tryParseCurrencyAmount('1', invertPrice ? currency1 : currency0)
  const price =
    baseAmount && parsedQuoteAmount
      ? new Price(baseAmount.currency, parsedQuoteAmount.currency, baseAmount.quotient, parsedQuoteAmount.quotient)
      : undefined

  return invertPrice ? price?.invert() : price
}

function getPrice(
  opts:
    | {
        type: ProtocolVersion.V4
        pool?: V4Pool
        currency0?: Currency
      }
    | {
        type: ProtocolVersion.V3
        pool?: V3Pool
        currency0?: Token
      },
) {
  const { type, pool, currency0 } = opts
  if (!pool || !currency0) {
    return undefined
  }

  return type === ProtocolVersion.V4 ? pool.priceOf(currency0) : pool.priceOf(currency0)
}

function isInvalidPrice(price?: Price<Currency, Currency>) {
  const sqrtRatioX96 = price ? encodeSqrtRatioX96(price.numerator, price.denominator) : undefined
  return (
    !!price &&
    !!sqrtRatioX96 &&
    !(
      JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
      JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)
    )
  )
}

function createMockV3Pool({
  baseToken,
  quoteToken,
  fee,
  price,
  invalidPrice,
}: {
  baseToken?: Token
  quoteToken?: Token
  fee: FeeAmount
  price?: Price<Currency, Currency>
  invalidPrice?: boolean
}) {
  if (!baseToken || !quoteToken || !fee || !price || invalidPrice) {
    return undefined
  }

  const wrappedPrice = new Price(
    price.baseCurrency.wrapped,
    price.quoteCurrency.wrapped,
    price.denominator,
    price.numerator,
  )

  const invertedPrice = wrappedPrice.baseCurrency.sortsBefore(wrappedPrice.quoteCurrency)
    ? wrappedPrice
    : wrappedPrice.invert()
  const currentTick = priceToClosestV3Tick(invertedPrice)
  const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)

  const pool = new V3Pool(baseToken, quoteToken, fee, currentSqrt, JSBI.BigInt(0), currentTick, [])
  return pool
}

function createMockV4Pool({
  baseToken,
  quoteToken,
  fee,
  hook,
  price,
  invalidPrice,
}: {
  baseToken?: Currency
  quoteToken?: Currency
  fee: FeeData
  hook?: string
  price?: Price<Currency, Currency>
  invalidPrice?: boolean
}): V4Pool | undefined {
  if (!baseToken || !quoteToken || !price || invalidPrice) {
    return undefined
  }

  const currentTick = priceToClosestV4Tick(price)
  const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
  const pool = new V4Pool(
    baseToken,
    quoteToken,
    fee.feeAmount,
    fee.tickSpacing,
    hook ?? ZERO_ADDRESS,
    currentSqrt,
    JSBI.BigInt(0),
    currentTick,
  )
  return pool
}

function createMockPair(price?: Price<Currency, Currency>) {
  if (price) {
    return new Pair(
      CurrencyAmount.fromRawAmount(price.quoteCurrency.wrapped, price.numerator),
      CurrencyAmount.fromRawAmount(price.baseCurrency.wrapped, price.denominator),
    )
  } else {
    return undefined
  }
}

export function getDependentAmountFromV2Pair({
  independentAmount,
  otherAmount,
  pair,
  exactField,
  token0,
  token1,
  dependentToken,
}: {
  independentAmount?: CurrencyAmount<Currency>
  otherAmount?: CurrencyAmount<Currency>
  pair?: Pair
  exactField: PositionField
  token0?: Currency
  token1?: Currency
  dependentToken?: Currency
}): CurrencyAmount<Currency> | undefined {
  const [token0Wrapped, token1Wrapped] = [token0?.wrapped, token1?.wrapped]
  if (!token0Wrapped || !token1Wrapped || !independentAmount || !pair) {
    return undefined
  }

  try {
    const dependentTokenAmount =
      exactField === PositionField.TOKEN0
        ? pair.priceOf(token0Wrapped).quote(independentAmount.wrapped)
        : pair.priceOf(token1Wrapped).quote(independentAmount.wrapped)

    return dependentToken
      ? dependentToken?.isNative
        ? CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
        : dependentTokenAmount
      : undefined
  } catch (e) {
    // in some cases there can be an initialized pool but there is no liquidity in which case
    // the user can enter whatever they want for the dependent amount and that pool will be created
    return otherAmount
  }
}

export function getDependentAmountFromV3Position({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V3Pool
  tickLower: number
  tickUpper: number
}): CurrencyAmount<Currency> {
  const wrappedIndependentAmount = independentAmount.wrapped
  const independentTokenIsFirstToken = wrappedIndependentAmount.currency.equals(pool.token0)

  if (independentTokenIsFirstToken) {
    return V3Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: wrappedIndependentAmount.quotient,
      useFullPrecision: true,
    }).amount1
  }

  return V3Position.fromAmount1({
    pool,
    tickLower,
    tickUpper,
    amount1: wrappedIndependentAmount.quotient,
  }).amount0
}

export function getDependentAmountFromV4Position({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V4Pool
  tickLower: number
  tickUpper: number
}): CurrencyAmount<Currency> {
  const independentTokenIsFirstToken = independentAmount.currency.equals(pool.token0)

  if (independentTokenIsFirstToken) {
    return V4Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: independentAmount.quotient,
      useFullPrecision: true,
    }).amount1
  }

  return V4Position.fromAmount1({
    pool,
    tickLower,
    tickUpper,
    amount1: independentAmount.quotient,
  }).amount0
}

export function getV2PriceRangeInfo({
  state,
  derivedPositionInfo,
}: {
  state: PriceRangeState
  derivedPositionInfo: CreateV2PositionInfo
}): V2PriceRangeInfo {
  const { currencies } = derivedPositionInfo
  const [baseCurrency] = getInvertedTuple(currencies, state.priceInverted)

  const baseToken = getCurrencyWithWrap(baseCurrency, ProtocolVersion.V2)
  const sortedTokens = getSortedCurrenciesTuple(
    getCurrencyWithWrap(currencies[0], ProtocolVersion.V2),
    getCurrencyWithWrap(currencies[1], ProtocolVersion.V2),
  )
  const priceDifference = getPriceDifference({
    initialPrice: state.initialPrice,
    defaultInitialPrice: derivedPositionInfo.defaultInitialPrice,
    priceInverted: state.priceInverted,
  })

  const price = getInitialPrice({
    baseCurrency: baseToken,
    sortedCurrencies: sortedTokens,
    initialPrice: state.initialPrice,
  })

  const invertPrice = Boolean(baseToken && sortedTokens[0] && !baseToken.equals(sortedTokens[0]))

  return {
    protocolVersion: ProtocolVersion.V2,
    price,
    mockPair: createMockPair(price),
    deposit0Disabled: false,
    deposit1Disabled: false,
    invertPrice,
    priceDifference,
  } satisfies V2PriceRangeInfo
}

export function getV3PriceRangeInfo({
  state,
  positionState,
  derivedPositionInfo,
}: {
  state: PriceRangeState
  positionState: PositionState
  derivedPositionInfo: CreateV3PositionInfo
}): V3PriceRangeInfo {
  const { fee } = positionState
  const { protocolVersion, currencies } = derivedPositionInfo
  const pool = derivedPositionInfo.pool

  const tokenA = getCurrencyWithWrap(currencies[0], protocolVersion)
  const tokenB = getCurrencyWithWrap(currencies[1], protocolVersion)
  const sortedTokens = getSortedCurrenciesTuple(tokenA, tokenB)
  const [sortedToken0, sortedToken1] = sortedTokens

  const [baseCurrency, quoteCurrency] = getInvertedTuple(currencies, state.priceInverted)
  const [baseToken, quoteToken] = [
    getCurrencyWithWrap(baseCurrency, protocolVersion),
    getCurrencyWithWrap(quoteCurrency, protocolVersion),
  ]

  const priceDifference = getPriceDifference({
    initialPrice: state.initialPrice,
    defaultInitialPrice: derivedPositionInfo.defaultInitialPrice,
    priceInverted: state.priceInverted,
  })

  const initialPriceTokens = getInvertedTuple(
    [getCurrencyWithWrap(currencies[0], protocolVersion), getCurrencyWithWrap(currencies[1], protocolVersion)],
    state.priceInverted,
  )

  const price = derivedPositionInfo.creatingPoolOrPair
    ? getInitialPrice({
        baseCurrency: initialPriceTokens[0],
        sortedCurrencies: sortedTokens,
        initialPrice: state.initialPrice,
      })
    : getPrice({
        type: ProtocolVersion.V3,
        pool,
        currency0: sortedToken0,
      })
  const invalidPrice = isInvalidPrice(price)
  const mockPool = createMockV3Pool({
    baseToken,
    quoteToken,
    fee: fee.feeAmount,
    price,
    invalidPrice,
  })

  const poolForPosition = pool ?? mockPool
  const tickSpaceLimits: [number, number] = [
    nearestUsableTick(TickMath.MIN_TICK, fee.tickSpacing),
    nearestUsableTick(TickMath.MAX_TICK, fee.tickSpacing),
  ]

  const invertPrice = Boolean(baseToken && sortedToken0 && !baseToken.equals(sortedToken0))
  const [baseRangeInput, quoteRangeInput] = invertPrice
    ? [state.maxPrice, state.minPrice]
    : [state.minPrice, state.maxPrice]

  const lowerTick =
    baseRangeInput === ''
      ? tickSpaceLimits[0]
      : invertPrice
        ? tryParseTick(sortedToken1, sortedToken0, fee.feeAmount, state.maxPrice)
        : tryParseTick(sortedToken0, sortedToken1, fee.feeAmount, state.minPrice)
  const upperTick =
    quoteRangeInput === ''
      ? tickSpaceLimits[1]
      : invertPrice
        ? tryParseTick(sortedToken1, sortedToken0, fee.feeAmount, state.minPrice)
        : tryParseTick(sortedToken0, sortedToken1, fee.feeAmount, state.maxPrice)

  const ticks: [OptionalNumber, OptionalNumber] = [lowerTick, upperTick]
  const invalidRange = Boolean(lowerTick !== undefined && upperTick !== undefined && lowerTick >= upperTick)

  const ticksAtLimit: [boolean, boolean] = state.fullRange
    ? [true, true]
    : [lowerTick === tickSpaceLimits[0], upperTick === tickSpaceLimits[1]]

  const pricesAtLimit: [OptionalCurrencyPrice, OptionalCurrencyPrice] = [
    getTickToPrice(sortedToken0, sortedToken1, tickSpaceLimits[0]),
    getTickToPrice(sortedToken0, sortedToken1, tickSpaceLimits[1]),
  ]

  const pricesAtTicks: [OptionalCurrencyPrice, OptionalCurrencyPrice] = [
    getTickToPrice(sortedToken0, sortedToken1, ticks[0]),
    getTickToPrice(sortedToken0, sortedToken1, ticks[1]),
  ]

  const isSorted = areCurrenciesEqual(baseToken, sortedToken0)
  const prices = getPrices({
    baseCurrency: baseToken,
    quoteCurrency: quoteToken,
    pricesAtLimit,
    pricesAtTicks,
    state,
  })

  const outOfRange = Boolean(
    !invalidRange && price && prices[0] && prices[1] && (price.lessThan(prices[0]) || price.greaterThan(prices[1])),
  )

  // This is in terms of the sorted tokens
  const deposit0Disabled = Boolean(
    upperTick !== undefined && poolForPosition && poolForPosition.tickCurrent >= upperTick,
  )
  const deposit1Disabled = Boolean(
    lowerTick !== undefined && poolForPosition && poolForPosition.tickCurrent <= lowerTick,
  )

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

  return {
    protocolVersion,
    ticks,
    ticksAtLimit,
    isSorted,
    price,
    prices,
    pricesAtTicks,
    pricesAtLimit,
    priceDifference,
    tickSpaceLimits,
    invertPrice,
    invalidPrice,
    invalidRange,
    outOfRange,
    deposit0Disabled: depositADisabled,
    deposit1Disabled: depositBDisabled,
    mockPool,
  } satisfies V3PriceRangeInfo
}

function tryParseV4Tick(
  baseToken?: Currency,
  quoteToken?: Currency,
  value?: string,
  tickSpacing?: number,
): number | undefined {
  if (!baseToken || !quoteToken || !value || !tickSpacing) {
    return undefined
  }

  const price = tryParsePrice(baseToken, quoteToken, value)

  if (!price) {
    return undefined
  }

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

  if (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)) {
    tick = TickMath.MAX_TICK
  } else if (JSBI.lessThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO)) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestV4Tick(price)
  }

  return nearestUsableTick(tick, tickSpacing)
}

export function getV4PriceRangeInfo({
  state,
  positionState,
  derivedPositionInfo,
}: {
  state: PriceRangeState
  positionState: PositionState
  derivedPositionInfo: CreateV4PositionInfo
}): V4PriceRangeInfo {
  const { fee, hook, initialPosition } = positionState
  const { protocolVersion, currencies, pool } = derivedPositionInfo

  const sortedCurrencies = getSortedCurrenciesTuple(currencies[0], currencies[1])
  const [sortedCurrency0, sortedCurrency1] = sortedCurrencies
  const [baseCurrency, quoteCurrency] = getInvertedTuple(currencies, state.priceInverted)
  const [initialPriceBaseCurrency] = getInvertedTuple(currencies, state.priceInverted)

  const priceDifference = getPriceDifference({
    initialPrice: state.initialPrice,
    defaultInitialPrice: derivedPositionInfo.defaultInitialPrice,
    priceInverted: state.priceInverted,
  })

  const price = derivedPositionInfo.creatingPoolOrPair
    ? getInitialPrice({
        baseCurrency: initialPriceBaseCurrency,
        sortedCurrencies,
        initialPrice: state.initialPrice,
      })
    : getPrice({
        type: ProtocolVersion.V4,
        pool,
        currency0: sortedCurrency0,
      })
  const invalidPrice = isInvalidPrice(price)
  const mockPool = createMockV4Pool({
    baseToken: baseCurrency,
    quoteToken: quoteCurrency,
    fee,
    hook,
    price,
    invalidPrice,
  })

  const poolForPosition = pool ?? mockPool
  const tickSpaceLimits: [OptionalNumber, OptionalNumber] =
    initialPosition?.tickLower && initialPosition?.tickUpper
      ? [initialPosition.tickLower, initialPosition.tickUpper]
      : [
          poolForPosition ? nearestUsableTick(TickMath.MIN_TICK, poolForPosition.tickSpacing) : undefined,
          poolForPosition ? nearestUsableTick(TickMath.MAX_TICK, poolForPosition.tickSpacing) : undefined,
        ]

  const invertPrice = Boolean(baseCurrency && sortedCurrency0 && !baseCurrency.equals(sortedCurrency0))
  const [baseRangeInput, quoteRangeInput] = invertPrice
    ? [state.maxPrice, state.minPrice]
    : [state.minPrice, state.maxPrice]
  const lowerTick =
    baseRangeInput === '' || initialPosition?.isOutOfRange
      ? tickSpaceLimits[0]
      : invertPrice
        ? tryParseV4Tick(sortedCurrency1, sortedCurrency0, state.maxPrice, poolForPosition?.tickSpacing)
        : tryParseV4Tick(sortedCurrency0, sortedCurrency1, state.minPrice, poolForPosition?.tickSpacing)
  const upperTick =
    quoteRangeInput === '' || initialPosition?.isOutOfRange
      ? tickSpaceLimits[1]
      : invertPrice
        ? tryParseV4Tick(sortedCurrency1, sortedCurrency0, state.minPrice, poolForPosition?.tickSpacing)
        : tryParseV4Tick(sortedCurrency0, sortedCurrency1, state.maxPrice, poolForPosition?.tickSpacing)
  const ticks: [OptionalNumber, OptionalNumber] = [lowerTick, upperTick]
  const invalidRange = Boolean(lowerTick !== undefined && upperTick !== undefined && lowerTick >= upperTick)

  const ticksAtLimit: [boolean, boolean] = state.fullRange
    ? [true, true]
    : [lowerTick === tickSpaceLimits[0], upperTick === tickSpaceLimits[1]]

  const pricesAtLimit: [OptionalCurrencyPrice, OptionalCurrencyPrice] = [
    getV4TickToPrice(sortedCurrency0, sortedCurrency1, tickSpaceLimits[0]),
    getV4TickToPrice(sortedCurrency0, sortedCurrency1, tickSpaceLimits[1]),
  ]

  const pricesAtTicks: [OptionalCurrencyPrice, OptionalCurrencyPrice] = [
    getV4TickToPrice(sortedCurrency0, sortedCurrency1, ticks[0]),
    getV4TickToPrice(sortedCurrency0, sortedCurrency1, ticks[1]),
  ]

  const isSorted = areCurrenciesEqual(baseCurrency, sortedCurrency0)
  const prices: [OptionalCurrencyPrice, OptionalCurrencyPrice] = getPrices({
    baseCurrency,
    quoteCurrency,
    pricesAtLimit,
    pricesAtTicks,
    state,
  })

  const outOfRange: boolean = Boolean(
    !invalidRange && price && prices[0] && prices[1] && (price.lessThan(prices[0]) || price.greaterThan(prices[1])),
  )

  // This is in terms of the sorted tokens
  const deposit0Disabled = Boolean(
    upperTick !== undefined && poolForPosition && poolForPosition.tickCurrent >= upperTick,
  )
  const deposit1Disabled = Boolean(
    lowerTick !== undefined && poolForPosition && poolForPosition.tickCurrent <= lowerTick,
  )

  const depositADisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && currencies[0] && poolForPosition.token0.equals(currencies[0])) ||
        (deposit1Disabled && poolForPosition && currencies[0] && poolForPosition.token1.equals(currencies[0])),
    )
  const depositBDisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && currencies[1] && poolForPosition.token0.equals(currencies[1])) ||
        (deposit1Disabled && poolForPosition && currencies[1] && poolForPosition.token1.equals(currencies[1])),
    )

  return {
    protocolVersion,
    ticks,
    ticksAtLimit,
    isSorted,
    price,
    prices,
    pricesAtTicks,
    pricesAtLimit,
    priceDifference,
    tickSpaceLimits,
    invertPrice,
    invalidPrice,
    invalidRange,
    outOfRange,
    deposit0Disabled: depositADisabled,
    deposit1Disabled: depositBDisabled,
    mockPool,
  } satisfies V4PriceRangeInfo
}

export function generateAddLiquidityApprovalParams({
  account,
  positionState,
  derivedPositionInfo,
  derivedDepositInfo,
}: {
  account?: AccountMeta
  positionState: PositionState
  derivedPositionInfo: CreatePositionInfo
  derivedDepositInfo: DepositInfo
}): CheckApprovalLPRequest | undefined {
  const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
  const currencies = derivedPositionInfo.currencies
  const { currencyAmounts } = derivedDepositInfo

  if (
    !account?.address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts?.TOKEN1 ||
    !validateCurrencyInput(currencies)
  ) {
    return undefined
  }

  return {
    simulateTransaction: true,
    walletAddress: account.address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    protocol: apiProtocolItems,
    token0: getCurrencyAddressForTradingApi(currencies[0]),
    token1: getCurrencyAddressForTradingApi(currencies[1]),
    amount0: currencyAmounts?.TOKEN0?.quotient.toString(),
    amount1: currencyAmounts?.TOKEN1?.quotient.toString(),
  } satisfies CheckApprovalLPRequest
}

// Returns the sorted token that is independent.
// For example if the top box on the deposit form corresponds to token0 (lower token sorted by address)
// and the user types into that form then the independent token is token0.
// Or if the top box corresponds to token1 (higher token sorted by address)
// and the user types into that box then the independent token is token1
// Also returns the index of token0 and token1 in relation to the unsortedCurrencies
function getIndependentToken({
  unsortedCurrencies,
  sortedToken0,
  sortedToken1,
  independentField,
  protocolVersion,
}: {
  unsortedCurrencies: [Currency, Currency]
  sortedToken0: Currency
  sortedToken1: Currency
  independentField: PositionField
  protocolVersion: ProtocolVersion
}): {
  independentToken: IndependentToken.TOKEN_0 | IndependentToken.TOKEN_1
  token0Index: PositionField
  token1Index: PositionField
} {
  const tokenA = getCurrencyWithWrap(unsortedCurrencies[0], protocolVersion)
  const tokenB = getCurrencyWithWrap(unsortedCurrencies[1], protocolVersion)
  const token0Index = tokenA && sortedToken0.equals(tokenA) ? PositionField.TOKEN0 : PositionField.TOKEN1
  const token1Index = tokenB && sortedToken1.equals(tokenB) ? PositionField.TOKEN1 : PositionField.TOKEN0

  const independentToken =
    independentField === PositionField.TOKEN0
      ? token0Index === PositionField.TOKEN0
        ? IndependentToken.TOKEN_0
        : IndependentToken.TOKEN_1
      : token1Index === PositionField.TOKEN1
        ? IndependentToken.TOKEN_1
        : IndependentToken.TOKEN_0

  return {
    independentToken,
    token0Index,
    token1Index,
  }
}

export function generateCreateCalldataQueryParams({
  account,
  approvalCalldata,
  positionState,
  derivedPositionInfo,
  priceRangeState,
  derivedPriceRangeInfo,
  derivedDepositInfo,
  independentField,
}: {
  account?: AccountMeta
  approvalCalldata?: CheckApprovalLPResponse
  positionState: PositionState
  derivedPositionInfo: CreatePositionInfo
  priceRangeState: PriceRangeState
  derivedPriceRangeInfo: PriceRangeInfo
  derivedDepositInfo: DepositInfo
  independentField: PositionField
}): CreateLPPositionRequest | undefined {
  const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
  const currencies = derivedPositionInfo.currencies
  const { currencyAmounts } = derivedDepositInfo

  if (
    !account?.address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts?.TOKEN1 ||
    !validateCurrencyInput(currencies)
  ) {
    return undefined
  }

  const { token0Approval, token1Approval, positionTokenApproval, permitData } = approvalCalldata ?? {}

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    if (derivedPositionInfo.protocolVersion !== derivedPriceRangeInfo.protocolVersion) {
      return undefined
    }

    const pair = derivedPositionInfo.pair ?? derivedPriceRangeInfo.mockPair

    if (!pair) {
      return undefined
    }

    // token0 and token1 from the sdk are automatically sorted and we need to ensure the values we send
    // to the trading API are also sorted
    const sortedToken0 = pair.token0
    const sortedToken1 = pair.token1

    const { independentToken, token0Index, token1Index } = getIndependentToken({
      unsortedCurrencies: currencies,
      sortedToken0,
      sortedToken1,
      independentField,
      protocolVersion: derivedPositionInfo.protocolVersion,
    })
    const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
    const independentAmount = currencyAmounts[independentField]
    const dependentAmount = currencyAmounts[dependentField]

    return {
      simulateTransaction: !(permitData || token0Approval || token1Approval || positionTokenApproval),
      protocol: apiProtocolItems,
      walletAddress: account.address,
      chainId: currencyAmounts.TOKEN0.currency.chainId,
      independentAmount: independentAmount?.quotient.toString(),
      independentToken,
      defaultDependentAmount: dependentAmount?.quotient.toString(),
      position: {
        pool: {
          token0: getCurrencyAddressForTradingApi(currencyAmounts[token0Index]?.currency),
          token1: getCurrencyAddressForTradingApi(currencyAmounts[token1Index]?.currency),
        },
      },
    } satisfies CreateLPPositionRequest
  }

  if (derivedPositionInfo.protocolVersion !== derivedPriceRangeInfo.protocolVersion) {
    return undefined
  }

  const pool = derivedPositionInfo.pool ?? derivedPriceRangeInfo.mockPool
  if (!pool) {
    return undefined
  }

  const tickLower = priceRangeState.fullRange
    ? derivedPriceRangeInfo.tickSpaceLimits[0]
    : derivedPriceRangeInfo.ticks?.[0]
  const tickUpper = priceRangeState.fullRange
    ? derivedPriceRangeInfo.tickSpaceLimits[1]
    : derivedPriceRangeInfo.ticks?.[1]

  if (tickLower === undefined || tickUpper === undefined) {
    return undefined
  }

  const creatingPool = derivedPositionInfo.creatingPoolOrPair
  const initialPrice = creatingPool ? pool.sqrtRatioX96.toString() : undefined
  const tickSpacing = pool.tickSpacing

  // token0 and token1 from the sdk are automatically sorted and we need to ensure the values we send
  // to the trading API are also sorted
  const sortedToken0 = pool.token0
  const sortedToken1 = pool.token1

  const { independentToken, token0Index, token1Index } = getIndependentToken({
    sortedToken0,
    sortedToken1,
    unsortedCurrencies: currencies,
    independentField,
    protocolVersion: derivedPositionInfo.protocolVersion,
  })
  const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  const independentAmount = currencyAmounts[independentField]
  const dependentAmount = currencyAmounts[dependentField]

  return {
    simulateTransaction: !(permitData || token0Approval || token1Approval || positionTokenApproval),
    protocol: apiProtocolItems,
    walletAddress: account.address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    independentAmount: independentAmount?.quotient.toString(),
    independentToken,
    initialDependentAmount: initialPrice && dependentAmount?.quotient?.toString(), // only set this if there is an initialPrice
    initialPrice,
    position: {
      tickLower,
      tickUpper,
      pool: {
        tickSpacing,
        token0: getCurrencyAddressForTradingApi(currencyAmounts[token0Index]?.currency),
        token1: getCurrencyAddressForTradingApi(currencyAmounts[token1Index]?.currency),
        fee: positionState.fee.feeAmount,
        hooks: positionState.hook,
      },
    },
  }
}

export function generateCreatePositionTxRequest({
  approvalCalldata,
  createCalldata,
  createCalldataQueryParams,
  derivedPositionInfo,
  derivedDepositInfo,
}: {
  approvalCalldata?: CheckApprovalLPResponse
  createCalldata?: CreateLPPositionResponse
  createCalldataQueryParams?: CreateLPPositionRequest
  derivedPositionInfo: CreatePositionInfo
  derivedDepositInfo: DepositInfo
}): CreatePositionTxAndGasInfo | undefined {
  const { currencyAmounts } = derivedDepositInfo

  if (!createCalldata || !currencyAmounts?.TOKEN0 || !currencyAmounts?.TOKEN1) {
    return undefined
  }

  const validatedApprove0Request = validateTransactionRequest(approvalCalldata?.token0Approval)
  if (approvalCalldata?.token0Approval && !validatedApprove0Request) {
    return undefined
  }

  const validatedApprove1Request = validateTransactionRequest(approvalCalldata?.token1Approval)
  if (approvalCalldata?.token1Approval && !validatedApprove1Request) {
    return undefined
  }

  const validatedRevoke0Request = validateTransactionRequest(approvalCalldata?.token0Cancel)
  if (approvalCalldata?.token0Cancel && !validatedRevoke0Request) {
    return undefined
  }

  const validatedRevoke1Request = validateTransactionRequest(approvalCalldata?.token1Cancel)
  if (approvalCalldata?.token1Cancel && !validatedRevoke1Request) {
    return undefined
  }

  const validatedPermitRequest = validatePermit(approvalCalldata?.permitData)
  if (approvalCalldata?.permitData && !validatedPermitRequest) {
    return undefined
  }

  const txRequest = validateTransactionRequest(createCalldata.create)
  if (!txRequest) {
    return undefined
  }

  const queryParams: CreateLPPositionRequest | undefined =
    derivedPositionInfo.protocolVersion === ProtocolVersion.V4
      ? { ...createCalldataQueryParams, batchPermitData: validatedPermitRequest }
      : createCalldataQueryParams

  return {
    type: LiquidityTransactionType.Create,
    unsigned: Boolean(approvalCalldata?.permitData),
    protocolVersion: derivedPositionInfo.protocolVersion,
    createPositionRequestArgs: queryParams,
    action: {
      type: LiquidityTransactionType.Create,
      currency0Amount: currencyAmounts.TOKEN0,
      currency1Amount: currencyAmounts.TOKEN1,
      liquidityToken:
        derivedPositionInfo.protocolVersion === ProtocolVersion.V2
          ? derivedPositionInfo.pair?.liquidityToken
          : undefined,
    },
    approveToken0Request: validatedApprove0Request,
    approveToken1Request: validatedApprove1Request,
    txRequest,
    approvePositionTokenRequest: undefined,
    revokeToken0Request: validatedRevoke0Request,
    revokeToken1Request: validatedRevoke1Request,
    permit: validatedPermitRequest,
  } satisfies CreatePositionTxAndGasInfo
}

export function getPoolIdOrAddressFromCreatePositionInfo(positionInfo: CreatePositionInfo): string | undefined {
  switch (positionInfo.protocolVersion) {
    case ProtocolVersion.V2:
      return positionInfo.pair?.liquidityToken.address
    case ProtocolVersion.V3:
      return positionInfo.pool?.chainId && positionInfo.currencies[0] && positionInfo.currencies[1]
        ? PoolCache.getPoolAddress(
            V3_CORE_FACTORY_ADDRESSES[positionInfo.pool.chainId],
            positionInfo.currencies[0].wrapped,
            positionInfo.currencies[1].wrapped,
            positionInfo.pool.fee,
            positionInfo.pool.chainId,
          )
        : undefined
    case ProtocolVersion.V4:
    default:
      return positionInfo.pool?.poolId
  }
}

export function canUnwrapCurrency(currency: OptionalCurrency, protocolVersion?: ProtocolVersion): boolean {
  if (protocolVersion === ProtocolVersion.V4 || !currency) {
    return false
  }

  const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency?.chainId]
  return areCurrenciesEqual(wrappedNative, currency)
}

export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: Currency
  shouldUnwrap: boolean
}): Currency
export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: OptionalCurrency
  shouldUnwrap: boolean
}): OptionalCurrency
export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: OptionalCurrency
  shouldUnwrap: boolean
}) {
  if (!currency) {
    return undefined
  }

  const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency.chainId]
  const isWrappedNative = areCurrenciesEqual(wrappedNative, currency)

  if (!isWrappedNative || !shouldUnwrap) {
    return currency
  }

  return nativeOnChain(currency.chainId)
}

const WARNING_PRICE_DIFFERENCE_PERCENTAGE = 5
const CRITICAL_PRICE_DIFFERENCE_PERCENTAGE = 10

function getPriceDifference({
  initialPrice,
  defaultInitialPrice,
  priceInverted,
}: {
  initialPrice: string
  defaultInitialPrice?: Price<Currency, Currency>
  priceInverted: boolean
}): PriceDifference | undefined {
  // Roughly estimate the price difference between the initialPrice (user input)
  // and the defaultInitialPrice (derived from a quote) if we have both.
  const initialPriceNumber = Number(initialPrice)
  const defaultInitialPriceNumber = priceInverted
    ? Number(defaultInitialPrice?.invert().toSignificant(8))
    : Number(defaultInitialPrice?.toSignificant(8))

  if (!initialPriceNumber || !defaultInitialPriceNumber) {
    return undefined
  }

  const priceDifference = initialPriceNumber - defaultInitialPriceNumber
  const priceDifferencePercentage = (priceDifference / defaultInitialPriceNumber) * 100
  const priceDifferencePercentageRounded = Math.round(priceDifferencePercentage)
  const priceDifferencePercentageAbsolute = Math.abs(priceDifferencePercentageRounded)

  let warning: WarningSeverity | undefined
  if (priceDifferencePercentageAbsolute > CRITICAL_PRICE_DIFFERENCE_PERCENTAGE) {
    warning = WarningSeverity.High
  } else if (priceDifferencePercentageAbsolute > WARNING_PRICE_DIFFERENCE_PERCENTAGE) {
    warning = WarningSeverity.Medium
  }

  return {
    value: priceDifferencePercentageRounded,
    absoluteValue: priceDifferencePercentageAbsolute,
    warning,
  }
}
