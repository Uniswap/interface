/* eslint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  priceToClosestTick as priceToClosestV3Tick,
  TickMath,
  Pool as V3Pool,
} from '@uniswap/v3-sdk'
import { priceToClosestTick as priceToClosestV4Tick, Pool as V4Pool } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  FeeData,
  PositionState,
  PriceRangeInfo,
  PriceRangeState,
  V2PriceRangeInfo,
  V3PriceRangeInfo,
  V4PriceRangeInfo,
} from '~/components/Liquidity/Create/types'
import { getBaseAndQuoteCurrencies } from '~/components/Liquidity/utils/currency'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'
import { tryParsePrice } from '~/state/mint/v3/utils'
import { PositionField } from '~/types/position'

export function getTicksAtLimit({
  lowerTick,
  upperTick,
  tickSpacing,
  fullRange,
}: {
  lowerTick?: Maybe<number>
  upperTick?: Maybe<number>
  tickSpacing: number
  fullRange: boolean
}): [boolean, boolean] {
  if (fullRange) {
    return [true, true]
  }

  const minTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const maxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  return [lowerTick === minTick, upperTick === maxTick]
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

export function isInvalidPrice(price?: Price<Currency, Currency>) {
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

export function getFieldsDisabled({
  ticks,
  poolOrPair,
}: {
  ticks?: [Maybe<number>, Maybe<number>]
  poolOrPair?: V3Pool | V4Pool | Pair
}): { [field in PositionField]: boolean } {
  if (!ticks || !poolOrPair || !('tickCurrent' in poolOrPair)) {
    return {
      TOKEN0: false,
      TOKEN1: false,
    }
  }

  const [tickLower, tickUpper] = ticks

  const deposit0Disabled = Boolean(typeof tickUpper === 'number' && poolOrPair.tickCurrent >= tickUpper)
  const deposit1Disabled = Boolean(typeof tickLower === 'number' && poolOrPair.tickCurrent <= tickLower)

  return {
    TOKEN0: deposit0Disabled,
    TOKEN1: deposit1Disabled,
  }
}

export function getPriceRangeInfo({
  derivedPositionInfo,
  state,
  positionState,
}: {
  derivedPositionInfo: CreatePositionInfo
  state: PriceRangeState
  positionState: PositionState
}): PriceRangeInfo | undefined {
  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    return getV2PriceRangeInfo({ state, derivedPositionInfo })
  }

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V3) {
    return getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })
  }

  return getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })
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

  const price = getInitialPrice({
    priceInverted: state.priceInverted,
    sortedCurrencies: sdkCurrencies,
    initialPrice: state.initialPrice,
  })

  return {
    protocolVersion: ProtocolVersion.V2,
    price,
    mockPair: createMockPair(price),
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
}): V3PriceRangeInfo | undefined {
  const { fee } = positionState

  if (!fee) {
    return undefined
  }

  const {
    protocolVersion,
    currencies: { sdk: sdkCurrencies },
  } = derivedPositionInfo

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(sdkCurrencies, state.priceInverted)

  const price = derivedPositionInfo.creatingPoolOrPair
    ? getInitialPrice({
        priceInverted: state.priceInverted,
        sortedCurrencies: sdkCurrencies,
        initialPrice: state.initialPrice,
      })
    : getPrice({
        type: ProtocolVersion.V3,
        pool: derivedPositionInfo.pool,
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

  const tickSpaceLimits: [number, number] = [
    nearestUsableTick(TickMath.MIN_TICK, fee.tickSpacing),
    nearestUsableTick(TickMath.MAX_TICK, fee.tickSpacing),
  ]

  const [baseRangeInput, quoteRangeInput] = state.priceInverted
    ? [state.maxTick, state.minTick]
    : [state.minTick, state.maxTick]

  const lowerTick =
    baseRangeInput === undefined || state.fullRange
      ? tickSpaceLimits[0]
      : state.priceInverted
        ? -baseRangeInput
        : baseRangeInput
  const upperTick =
    quoteRangeInput === undefined || state.fullRange
      ? tickSpaceLimits[1]
      : state.priceInverted
        ? -quoteRangeInput
        : quoteRangeInput
  const ticks: [Maybe<number>, Maybe<number>] = [lowerTick, upperTick]

  return {
    protocolVersion,
    ticks,
    price,
    mockPool,
  } satisfies V3PriceRangeInfo
}

export function tryParseV4Tick({
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
    tick = TickMath.getTickAtSqrtRatio(sqrtRatioX96)
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
}): V4PriceRangeInfo | undefined {
  const { fee, hook, initialPosition } = positionState

  if (!fee) {
    return undefined
  }

  const {
    protocolVersion,
    currencies: { sdk: sortedCurrencies },
    pool,
  } = derivedPositionInfo

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(sortedCurrencies, state.priceInverted)

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
    ? [state.maxTick, state.minTick]
    : [state.minTick, state.maxTick]

  const lowerTick =
    baseRangeInput === undefined || initialPosition?.isOutOfRange || state.fullRange
      ? tickSpaceLimits[0]
      : state.priceInverted
        ? -baseRangeInput
        : baseRangeInput
  const upperTick =
    quoteRangeInput === undefined || initialPosition?.isOutOfRange || state.fullRange
      ? tickSpaceLimits[1]
      : state.priceInverted
        ? -quoteRangeInput
        : quoteRangeInput
  const ticks: [Maybe<number>, Maybe<number>] = [lowerTick, upperTick]

  return {
    protocolVersion,
    ticks,
    price,
    mockPool,
  } satisfies V4PriceRangeInfo
}

export function isInvalidRange(lowerTick: Maybe<number>, upperTick: Maybe<number>): boolean {
  return Boolean(typeof lowerTick === 'number' && typeof upperTick === 'number' && lowerTick >= upperTick)
}

export function isOutOfRange({
  poolOrPair,
  lowerTick,
  upperTick,
}: {
  poolOrPair: V3Pool | V4Pool | Pair | undefined
  lowerTick: Maybe<number>
  upperTick: Maybe<number>
}): boolean {
  const currentTick = poolOrPair && 'tickCurrent' in poolOrPair ? poolOrPair.tickCurrent : undefined
  if (
    isInvalidRange(lowerTick, upperTick) ||
    typeof currentTick !== 'number' ||
    typeof lowerTick !== 'number' ||
    typeof upperTick !== 'number'
  ) {
    return false
  }

  return currentTick < lowerTick || currentTick > upperTick
}
