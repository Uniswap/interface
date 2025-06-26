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
import type {
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
} from 'uniswap/src/data/tradingApi/__generated__'
import { IndependentToken } from 'uniswap/src/data/tradingApi/__generated__'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { CreatePositionTxAndGasInfo, LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'
import { getTickToPrice, getV4TickToPrice } from 'utils/getTickToPrice'

function getSortedCurrencies(a: Maybe<Currency>, b: Maybe<Currency>): { [field in PositionField]: Maybe<Currency> } {
  if (!a || !b) {
    return { TOKEN0: a, TOKEN1: b }
  }

  if (a.isNative) {
    return { TOKEN0: a, TOKEN1: b }
  }

  if (b.isNative) {
    return { TOKEN0: b, TOKEN1: a }
  }

  return a.sortsBefore(b) ? { TOKEN0: a, TOKEN1: b } : { TOKEN0: b, TOKEN1: a }
}

export function getSortedCurrenciesForProtocol({
  a,
  b,
  protocolVersion,
}: {
  a: Maybe<Currency>
  b: Maybe<Currency>
  protocolVersion: ProtocolVersion
}): { [field in PositionField]: Maybe<Currency> } {
  if (!a || !b) {
    return { TOKEN0: a, TOKEN1: b }
  }

  if (protocolVersion === ProtocolVersion.V4) {
    return getSortedCurrencies(a, b)
  }

  const wrappedA = getCurrencyWithWrap(a, protocolVersion)
  const wrappedB = getCurrencyWithWrap(b, protocolVersion)
  const sorted = getSortedCurrencies(wrappedA, wrappedB)

  const currency0 = !sorted.TOKEN0 || wrappedA?.equals(sorted.TOKEN0) ? a : b
  const currency1 = !sorted.TOKEN1 || wrappedB?.equals(sorted.TOKEN1) ? b : a

  return { TOKEN0: currency0, TOKEN1: currency1 }
}

export function getCurrencyForProtocol(
  currency: Currency,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token
export function getCurrencyForProtocol(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token | undefined
export function getCurrencyForProtocol(currency: Currency, protocolVersion: ProtocolVersion.V4): Currency
export function getCurrencyForProtocol(currency: Maybe<Currency>, protocolVersion: ProtocolVersion.V4): Maybe<Currency>
export function getCurrencyForProtocol(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.UNSPECIFIED | ProtocolVersion.V2 | ProtocolVersion.V3 | ProtocolVersion.V4,
): Maybe<Currency>
/**
 * Gets the currency or token that each protocol expects. For v2 + v3 if the native currency is passed then we return the wrapped version.
 * For v4 is a wrapped native token is passed then we return the native currency.
 */
export function getCurrencyForProtocol(
  currency: Maybe<Currency>,
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
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.V2 | ProtocolVersion.V3,
): Token | undefined
export function getCurrencyWithWrap(currency: Currency, protocolVersion: ProtocolVersion.V4): Currency
export function getCurrencyWithWrap(currency: Maybe<Currency>, protocolVersion: ProtocolVersion.V4): Maybe<Currency>
export function getCurrencyWithWrap(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion.UNSPECIFIED | ProtocolVersion.V2 | ProtocolVersion.V3 | ProtocolVersion.V4,
): Maybe<Currency>
export function getCurrencyWithWrap(
  currency: Maybe<Currency>,
  protocolVersion: ProtocolVersion,
): Maybe<Currency> | Token {
  if (protocolVersion === ProtocolVersion.V4 || currency?.isToken) {
    return currency
  }

  return currency?.wrapped
}

export function getTokenOrZeroAddress(currency: Currency): string
export function getTokenOrZeroAddress(currency: Maybe<Currency>): string | undefined
export function getTokenOrZeroAddress(currency: Maybe<Currency>): string | undefined {
  if (!currency) {
    return undefined
  }

  return currency.isToken ? currency.address : ZERO_ADDRESS
}

export function poolEnabledProtocolVersion(
  protocolVersion: ProtocolVersion,
): protocolVersion is ProtocolVersion.V3 | ProtocolVersion.V4 {
  return protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
}

export function pairEnabledProtocolVersion(protocolVersion: ProtocolVersion): protocolVersion is ProtocolVersion.V2 {
  return protocolVersion === ProtocolVersion.V2
}

// update to validate sort order
export function validateCurrencyInput(currencies: { [field in PositionField]: Maybe<Currency> }): boolean {
  return !!currencies.TOKEN0 && !!currencies.TOKEN1
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

export function getBaseAndQuoteCurrencies<T extends Maybe<Currency>>(
  sortedCurrencies: { [field in PositionField]: T },
  inverted: boolean,
): { baseCurrency: T; quoteCurrency: T } {
  return inverted
    ? { baseCurrency: sortedCurrencies.TOKEN1, quoteCurrency: sortedCurrencies.TOKEN0 }
    : { baseCurrency: sortedCurrencies.TOKEN0, quoteCurrency: sortedCurrencies.TOKEN1 }
}

function getPrices<T extends Currency>({
  baseCurrency,
  quoteCurrency,
  pricesAtLimit,
  pricesAtTicks,
  priceInverted,
  state,
}: {
  baseCurrency: Maybe<T>
  quoteCurrency: Maybe<T>
  pricesAtLimit: Maybe<Price<T, T>>[]
  pricesAtTicks: Maybe<Price<T, T>>[]
  priceInverted: boolean
  state: PriceRangeState
}): [Maybe<Price<T, T>>, Maybe<Price<T, T>>] {
  if (!baseCurrency || !quoteCurrency) {
    return [undefined, undefined]
  }

  const lowerPrice = state.fullRange ? pricesAtLimit[0] : pricesAtTicks[0]
  const upperPrice = state.fullRange ? pricesAtLimit[1] : pricesAtTicks[1]

  return priceInverted ? [upperPrice?.invert(), lowerPrice?.invert()] : [lowerPrice, upperPrice]
}

function getTicksAtLimit({
  lowerTick,
  upperTick,
  tickSpaceLimits,
  priceInverted,
  fullRange,
}: {
  lowerTick?: Maybe<number>
  upperTick?: Maybe<number>
  tickSpaceLimits: [Maybe<number>, Maybe<number>]
  priceInverted: boolean
  fullRange: boolean
}): [boolean, boolean] {
  if (fullRange) {
    return [true, true]
  }

  return priceInverted
    ? [upperTick === tickSpaceLimits[1], lowerTick === tickSpaceLimits[0]]
    : [lowerTick === tickSpaceLimits[0], upperTick === tickSpaceLimits[1]]
}

/**
 * Pools and Pairs in all protocol versions require that [currency0, currency1] be sorted.
 * * So, if the user-provided initial price is inverted w.r.t. the sorted order, we need to invert it again here.
 */
function getInitialPrice({
  priceInverted,
  sortedCurrencies,
  initialPrice,
}: {
  priceInverted: boolean
  sortedCurrencies: { [field in PositionField]: Maybe<Currency> }
  initialPrice: string
}) {
  const { TOKEN0: currency0, TOKEN1: currency1 } = sortedCurrencies

  const parsedQuoteAmount = tryParseCurrencyAmount(initialPrice, priceInverted ? currency0 : currency1)
  if (!parsedQuoteAmount) {
    return undefined
  }

  const baseAmount = tryParseCurrencyAmount('1', priceInverted ? currency1 : currency0)
  const price = baseAmount
    ? new Price(baseAmount.currency, parsedQuoteAmount.currency, baseAmount.quotient, parsedQuoteAmount.quotient)
    : undefined

  return priceInverted ? price?.invert() : price
}

function getPrice(
  opts:
    | {
        type: ProtocolVersion.V4
        pool?: V4Pool
        currency0?: Maybe<Currency>
        priceInverted: boolean
      }
    | {
        type: ProtocolVersion.V3
        pool?: V3Pool
        currency0?: Maybe<Token>
        priceInverted: boolean
      },
) {
  const { type, pool, currency0, priceInverted } = opts
  if (!pool || !currency0) {
    return undefined
  }

  const price = type === ProtocolVersion.V4 ? pool.priceOf(currency0) : pool.priceOf(currency0)
  return priceInverted ? price.invert() : price
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
  baseToken?: Maybe<Token>
  quoteToken?: Maybe<Token>
  fee: FeeAmount
  price?: Price<Currency, Currency>
  invalidPrice?: boolean
}) {
  if (!baseToken || !quoteToken || !price || invalidPrice) {
    return undefined
  }

  const wrappedPrice = new Price(
    price.baseCurrency.wrapped,
    price.quoteCurrency.wrapped,
    price.denominator,
    price.numerator,
  )

  const currentTick = priceToClosestV3Tick(wrappedPrice)
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
  baseToken: Maybe<Currency>
  quoteToken: Maybe<Currency>
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
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  dependentToken: Maybe<Currency>
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
      ? dependentToken.isNative
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
  const {
    currencies: { sdk: sdkCurrencies },
  } = derivedPositionInfo

  const priceDifference = getPriceDifference({
    initialPrice: state.initialPrice,
    defaultInitialPrice: derivedPositionInfo.defaultInitialPrice,
    priceInverted: state.priceInverted,
  })

  const price = getInitialPrice({
    priceInverted: state.priceInverted,
    sortedCurrencies: sdkCurrencies,
    initialPrice: state.initialPrice,
  })

  return {
    protocolVersion: ProtocolVersion.V2,
    price,
    mockPair: createMockPair(price),
    deposit0Disabled: false,
    deposit1Disabled: false,
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
  const {
    protocolVersion,
    currencies: { sdk: sdkCurrencies },
  } = derivedPositionInfo
  const pool = derivedPositionInfo.pool

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(sdkCurrencies, state.priceInverted)

  const priceDifference = getPriceDifference({
    initialPrice: state.initialPrice,
    defaultInitialPrice: derivedPositionInfo.defaultInitialPrice,
    priceInverted: state.priceInverted,
  })

  const price = derivedPositionInfo.creatingPoolOrPair
    ? getInitialPrice({
        priceInverted: state.priceInverted,
        sortedCurrencies: sdkCurrencies,
        initialPrice: state.initialPrice,
      })
    : getPrice({
        type: ProtocolVersion.V3,
        pool,
        currency0: sdkCurrencies.TOKEN0,
        priceInverted: state.priceInverted,
      })

  const invalidPrice = isInvalidPrice(price)

  const mockPool = createMockV3Pool({
    baseToken: baseCurrency,
    quoteToken: quoteCurrency,
    fee: fee.feeAmount,
    price,
    invalidPrice,
  })

  const poolForPosition = pool ?? mockPool
  const tickSpaceLimits: [number, number] = [
    nearestUsableTick(TickMath.MIN_TICK, fee.tickSpacing),
    nearestUsableTick(TickMath.MAX_TICK, fee.tickSpacing),
  ]

  const [baseRangeInput, quoteRangeInput] = state.priceInverted
    ? [state.maxPrice, state.minPrice]
    : [state.minPrice, state.maxPrice]

  const lowerTick =
    baseRangeInput === ''
      ? tickSpaceLimits[0]
      : state.priceInverted
        ? tryParseTick({
            baseToken: sdkCurrencies.TOKEN1,
            quoteToken: sdkCurrencies.TOKEN0,
            feeAmount: fee.feeAmount,
            value: state.maxPrice,
          })
        : tryParseTick({
            baseToken: sdkCurrencies.TOKEN0,
            quoteToken: sdkCurrencies.TOKEN1,
            feeAmount: fee.feeAmount,
            value: state.minPrice,
          })
  const upperTick =
    quoteRangeInput === ''
      ? tickSpaceLimits[1]
      : state.priceInverted
        ? tryParseTick({
            baseToken: sdkCurrencies.TOKEN1,
            quoteToken: sdkCurrencies.TOKEN0,
            feeAmount: fee.feeAmount,
            value: state.minPrice,
          })
        : tryParseTick({
            baseToken: sdkCurrencies.TOKEN0,
            quoteToken: sdkCurrencies.TOKEN1,
            feeAmount: fee.feeAmount,
            value: state.maxPrice,
          })
  const ticks: [Maybe<number>, Maybe<number>] = [lowerTick, upperTick]
  const invalidRange = Boolean(lowerTick !== undefined && upperTick !== undefined && lowerTick >= upperTick)

  const ticksAtLimit: [boolean, boolean] = getTicksAtLimit({
    lowerTick,
    upperTick,
    tickSpaceLimits,
    fullRange: state.fullRange,
    priceInverted: state.priceInverted,
  })

  const pricesAtLimit: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = [
    getTickToPrice({
      baseToken: sdkCurrencies.TOKEN0,
      quoteToken: sdkCurrencies.TOKEN1,
      tick: tickSpaceLimits[0],
    }),
    getTickToPrice({
      baseToken: sdkCurrencies.TOKEN0,
      quoteToken: sdkCurrencies.TOKEN1,
      tick: tickSpaceLimits[1],
    }),
  ]

  const pricesAtTicks: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = [
    getTickToPrice({
      baseToken: sdkCurrencies.TOKEN0,
      quoteToken: sdkCurrencies.TOKEN1,
      tick: ticks[0],
    }),
    getTickToPrice({
      baseToken: sdkCurrencies.TOKEN0,
      quoteToken: sdkCurrencies.TOKEN1,
      tick: ticks[1],
    }),
  ]

  const prices = getPrices({
    baseCurrency,
    quoteCurrency,
    pricesAtLimit,
    pricesAtTicks,
    priceInverted: state.priceInverted,
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

  return {
    protocolVersion,
    ticks,
    ticksAtLimit,
    price,
    prices,
    pricesAtTicks,
    pricesAtLimit,
    priceDifference,
    tickSpaceLimits,
    invalidPrice,
    invalidRange,
    outOfRange,
    deposit0Disabled,
    deposit1Disabled,
    mockPool,
  } satisfies V3PriceRangeInfo
}

function tryParseV4Tick({
  baseToken,
  quoteToken,
  value,
  tickSpacing,
}: {
  baseToken?: Maybe<Currency>
  quoteToken?: Maybe<Currency>
  value?: string
  tickSpacing?: number
}): number | undefined {
  if (!baseToken || !quoteToken || !value || !tickSpacing) {
    return undefined
  }

  const price = tryParsePrice({ baseToken, quoteToken, value })

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
  const {
    protocolVersion,
    currencies: { sdk: sortedCurrencies },
    pool,
  } = derivedPositionInfo

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(sortedCurrencies, state.priceInverted)

  const priceDifference = getPriceDifference({
    initialPrice: state.initialPrice,
    defaultInitialPrice: derivedPositionInfo.defaultInitialPrice,
    priceInverted: state.priceInverted,
  })

  const price = derivedPositionInfo.creatingPoolOrPair
    ? getInitialPrice({
        priceInverted: state.priceInverted,
        sortedCurrencies,
        initialPrice: state.initialPrice,
      })
    : getPrice({
        type: ProtocolVersion.V4,
        pool,
        currency0: sortedCurrencies.TOKEN0,
        priceInverted: state.priceInverted,
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
  const tickSpaceLimits: [Maybe<number>, Maybe<number>] =
    initialPosition?.tickLower && initialPosition.tickUpper
      ? [initialPosition.tickLower, initialPosition.tickUpper]
      : [
          poolForPosition ? nearestUsableTick(TickMath.MIN_TICK, poolForPosition.tickSpacing) : undefined,
          poolForPosition ? nearestUsableTick(TickMath.MAX_TICK, poolForPosition.tickSpacing) : undefined,
        ]

  const [baseRangeInput, quoteRangeInput] = state.priceInverted
    ? [state.maxPrice, state.minPrice]
    : [state.minPrice, state.maxPrice]

  const lowerTick =
    baseRangeInput === '' || initialPosition?.isOutOfRange
      ? tickSpaceLimits[0]
      : state.priceInverted
        ? tryParseV4Tick({
            baseToken: sortedCurrencies.TOKEN1,
            quoteToken: sortedCurrencies.TOKEN0,
            value: state.maxPrice,
            tickSpacing: poolForPosition?.tickSpacing,
          })
        : tryParseV4Tick({
            baseToken: sortedCurrencies.TOKEN0,
            quoteToken: sortedCurrencies.TOKEN1,
            value: state.minPrice,
            tickSpacing: poolForPosition?.tickSpacing,
          })
  const upperTick =
    quoteRangeInput === '' || initialPosition?.isOutOfRange
      ? tickSpaceLimits[1]
      : state.priceInverted
        ? tryParseV4Tick({
            baseToken: sortedCurrencies.TOKEN1,
            quoteToken: sortedCurrencies.TOKEN0,
            value: state.minPrice,
            tickSpacing: poolForPosition?.tickSpacing,
          })
        : tryParseV4Tick({
            baseToken: sortedCurrencies.TOKEN0,
            quoteToken: sortedCurrencies.TOKEN1,
            value: state.maxPrice,
            tickSpacing: poolForPosition?.tickSpacing,
          })
  const ticks: [Maybe<number>, Maybe<number>] = [lowerTick, upperTick]
  const invalidRange = Boolean(
    lowerTick !== undefined &&
      upperTick !== undefined &&
      typeof lowerTick === 'number' &&
      typeof upperTick === 'number' &&
      lowerTick >= upperTick,
  )

  const ticksAtLimit: [boolean, boolean] = getTicksAtLimit({
    lowerTick,
    upperTick,
    tickSpaceLimits,
    fullRange: state.fullRange,
    priceInverted: state.priceInverted,
  })

  const pricesAtLimit: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = [
    getV4TickToPrice({
      baseCurrency: sortedCurrencies.TOKEN0,
      quoteCurrency: sortedCurrencies.TOKEN1,
      tick: tickSpaceLimits[0],
    }),
    getV4TickToPrice({
      baseCurrency: sortedCurrencies.TOKEN0,
      quoteCurrency: sortedCurrencies.TOKEN1,
      tick: tickSpaceLimits[1],
    }),
  ]

  const pricesAtTicks: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = [
    getV4TickToPrice({
      baseCurrency: sortedCurrencies.TOKEN0,
      quoteCurrency: sortedCurrencies.TOKEN1,
      tick: ticks[0],
    }),
    getV4TickToPrice({
      baseCurrency: sortedCurrencies.TOKEN0,
      quoteCurrency: sortedCurrencies.TOKEN1,
      tick: ticks[1],
    }),
  ]

  const prices: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = getPrices({
    baseCurrency,
    quoteCurrency,
    pricesAtLimit,
    pricesAtTicks,
    priceInverted: state.priceInverted,
    state,
  })

  const outOfRange: boolean = Boolean(
    !invalidRange && price && prices[0] && prices[1] && (price.lessThan(prices[0]) || price.greaterThan(prices[1])),
  )

  // This is in terms of the sorted tokens
  const deposit0Disabled = Boolean(
    upperTick !== undefined && poolForPosition && poolForPosition.tickCurrent >= (upperTick ?? 0),
  )
  const deposit1Disabled = Boolean(
    lowerTick !== undefined && poolForPosition && poolForPosition.tickCurrent <= (lowerTick ?? 0),
  )

  return {
    protocolVersion,
    ticks,
    ticksAtLimit,
    price,
    prices,
    pricesAtTicks,
    pricesAtLimit,
    priceDifference,
    tickSpaceLimits,
    invalidPrice,
    invalidRange,
    outOfRange,
    deposit0Disabled,
    deposit1Disabled,
    mockPool,
  } satisfies V4PriceRangeInfo
}

export function generateAddLiquidityApprovalParams({
  account,
  positionState,
  derivedPositionInfo,
  derivedDepositInfo,
  generatePermitAsTransaction,
}: {
  account?: AccountMeta
  positionState: PositionState
  derivedPositionInfo: CreatePositionInfo
  derivedDepositInfo: DepositInfo
  generatePermitAsTransaction?: boolean
}): CheckApprovalLPRequest | undefined {
  const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
  const currencies = derivedPositionInfo.currencies.display
  const { currencyAmounts } = derivedDepositInfo

  if (
    !account?.address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(currencies)
  ) {
    return undefined
  }

  return {
    simulateTransaction: true,
    walletAddress: account.address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    protocol: apiProtocolItems,
    token0: getTokenOrZeroAddress(currencies.TOKEN0),
    token1: getTokenOrZeroAddress(currencies.TOKEN1),
    amount0: currencyAmounts.TOKEN0.quotient.toString(),
    amount1: currencyAmounts.TOKEN1.quotient.toString(),
    generatePermitAsTransaction:
      positionState.protocolVersion === ProtocolVersion.V4 ? generatePermitAsTransaction : undefined,
  } satisfies CheckApprovalLPRequest
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
  slippageTolerance,
}: {
  account?: AccountMeta
  approvalCalldata?: CheckApprovalLPResponse
  positionState: PositionState
  derivedPositionInfo: CreatePositionInfo
  priceRangeState: PriceRangeState
  derivedPriceRangeInfo: PriceRangeInfo
  derivedDepositInfo: DepositInfo
  independentField: PositionField
  slippageTolerance?: number
}): CreateLPPositionRequest | undefined {
  const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
  const sortedCurrencies = derivedPositionInfo.currencies.display
  const { currencyAmounts } = derivedDepositInfo

  if (
    !account?.address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(sortedCurrencies)
  ) {
    return undefined
  }

  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    permitData,
    token0PermitTransaction,
    token1PermitTransaction,
  } = approvalCalldata ?? {}

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    if (derivedPositionInfo.protocolVersion !== derivedPriceRangeInfo.protocolVersion) {
      return undefined
    }

    const pair = derivedPositionInfo.pair ?? derivedPriceRangeInfo.mockPair

    if (!pair || !sortedCurrencies.TOKEN0 || !sortedCurrencies.TOKEN1) {
      return undefined
    }

    const independentToken =
      independentField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1
    const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
    const independentAmount = currencyAmounts[independentField]
    const dependentAmount = currencyAmounts[dependentField]

    return {
      simulateTransaction: !(
        permitData ||
        token0PermitTransaction ||
        token1PermitTransaction ||
        token0Approval ||
        token1Approval ||
        positionTokenApproval
      ),
      protocol: apiProtocolItems,
      walletAddress: account.address,
      chainId: currencyAmounts.TOKEN0.currency.chainId,
      independentAmount: independentAmount?.quotient.toString(),
      independentToken,
      defaultDependentAmount: dependentAmount?.quotient.toString(),
      slippageTolerance,
      position: {
        pool: {
          token0: getTokenOrZeroAddress(sortedCurrencies.TOKEN0),
          token1: getTokenOrZeroAddress(sortedCurrencies.TOKEN1),
        },
      },
    } satisfies CreateLPPositionRequest
  }

  if (derivedPositionInfo.protocolVersion !== derivedPriceRangeInfo.protocolVersion) {
    return undefined
  }

  const pool = derivedPositionInfo.pool ?? derivedPriceRangeInfo.mockPool
  if (!pool || !sortedCurrencies.TOKEN0 || !sortedCurrencies.TOKEN1) {
    return undefined
  }

  const tickLower = priceRangeState.fullRange
    ? derivedPriceRangeInfo.tickSpaceLimits[0]
    : derivedPriceRangeInfo.ticks[0]
  const tickUpper = priceRangeState.fullRange
    ? derivedPriceRangeInfo.tickSpaceLimits[1]
    : derivedPriceRangeInfo.ticks[1]

  if (tickLower === undefined || tickUpper === undefined) {
    return undefined
  }

  const creatingPool = derivedPositionInfo.creatingPoolOrPair
  const initialPrice = creatingPool ? pool.sqrtRatioX96.toString() : undefined
  const tickSpacing = pool.tickSpacing

  const independentToken =
    independentField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1
  const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  const independentAmount = currencyAmounts[independentField]
  const dependentAmount = currencyAmounts[dependentField]

  return {
    simulateTransaction: !(
      permitData ||
      token0PermitTransaction ||
      token1PermitTransaction ||
      token0Approval ||
      token1Approval ||
      positionTokenApproval
    ),
    protocol: apiProtocolItems,
    walletAddress: account.address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    independentAmount: independentAmount?.quotient.toString(),
    independentToken,
    initialDependentAmount: initialPrice && dependentAmount?.quotient.toString(), // only set this if there is an initialPrice
    initialPrice,
    slippageTolerance,
    position: {
      tickLower: tickLower ?? undefined,
      tickUpper: tickUpper ?? undefined,
      pool: {
        tickSpacing,
        token0: getTokenOrZeroAddress(sortedCurrencies.TOKEN0),
        token1: getTokenOrZeroAddress(sortedCurrencies.TOKEN1),
        fee: positionState.fee.feeAmount,
        hooks: positionState.hook,
      },
    },
  } satisfies CreateLPPositionRequest
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

  if (!createCalldata || !currencyAmounts?.TOKEN0 || !currencyAmounts.TOKEN1) {
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

  const validatedToken0PermitTransaction = validateTransactionRequest(approvalCalldata?.token0PermitTransaction)
  const validatedToken1PermitTransaction = validateTransactionRequest(approvalCalldata?.token1PermitTransaction)

  const txRequest = validateTransactionRequest(createCalldata.create)
  if (!txRequest && !(validatedToken0PermitTransaction || validatedToken1PermitTransaction)) {
    // Allow missing txRequest if mismatched (unsigned flow using token0PermitTransaction/2)
    return undefined
  }

  const queryParams: CreateLPPositionRequest | undefined =
    derivedPositionInfo.protocolVersion === ProtocolVersion.V4
      ? { ...createCalldataQueryParams, batchPermitData: validatedPermitRequest }
      : createCalldataQueryParams

  return {
    type: LiquidityTransactionType.Create,
    unsigned: Boolean(validatedPermitRequest),
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
    permit: validatedPermitRequest ? { method: PermitMethod.TypedData, typedData: validatedPermitRequest } : undefined,
    token0PermitTransaction: validatedToken0PermitTransaction,
    token1PermitTransaction: validatedToken1PermitTransaction,
    positionTokenPermitTransaction: undefined,
  } satisfies CreatePositionTxAndGasInfo
}

export function getPoolIdOrAddressFromCreatePositionInfo(positionInfo: CreatePositionInfo): string | undefined {
  switch (positionInfo.protocolVersion) {
    case ProtocolVersion.V2:
      return positionInfo.pair?.liquidityToken.address
    case ProtocolVersion.V3:
      return positionInfo.pool?.chainId && positionInfo.currencies.sdk.TOKEN0 && positionInfo.currencies.sdk.TOKEN1
        ? PoolCache.getPoolAddress({
            factoryAddress: V3_CORE_FACTORY_ADDRESSES[positionInfo.pool.chainId],
            tokenA: positionInfo.currencies.sdk.TOKEN0,
            tokenB: positionInfo.currencies.sdk.TOKEN1,
            fee: positionInfo.pool.fee,
            chainId: positionInfo.pool.chainId,
          })
        : undefined
    case ProtocolVersion.V4:
    default:
      return positionInfo.pool?.poolId
  }
}

export function canUnwrapCurrency(currency: Maybe<Currency>, protocolVersion?: ProtocolVersion): boolean {
  if (protocolVersion === ProtocolVersion.V4 || !currency) {
    return false
  }

  const wrappedNative = WRAPPED_NATIVE_CURRENCY[currency.chainId]
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
  currency: Maybe<Currency>
  shouldUnwrap: boolean
}): Maybe<Currency>
export function getCurrencyWithOptionalUnwrap({
  currency,
  shouldUnwrap,
}: {
  currency: Maybe<Currency>
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
