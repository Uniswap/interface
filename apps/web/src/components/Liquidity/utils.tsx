// eslint-disable-next-line no-restricted-imports
import {
  PairPosition,
  PoolPosition,
  PositionStatus,
  ProtocolVersion,
  Pair as RestPair,
  Pool as RestPool,
  Position as RestPosition,
  Token as RestToken,
} from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { PositionInfo } from 'components/Liquidity/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { AppTFunction } from 'ui/src/i18n/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'

export function getProtocolVersionLabel(version: ProtocolVersion): string | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'V2'
    case ProtocolVersion.V3:
      return 'V3'
    case ProtocolVersion.V4:
      return 'V4'
  }
  return undefined
}

export function getProtocolItems(version: ProtocolVersion | undefined): ProtocolItems | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return ProtocolItems.V2
    case ProtocolVersion.V3:
      return ProtocolItems.V3
    case ProtocolVersion.V4:
      return ProtocolItems.V4
  }
  return undefined
}

export function getProtocolStatusLabel(status: PositionStatus, t: AppTFunction): string | undefined {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return t('common.withinRange')
    case PositionStatus.OUT_OF_RANGE:
      return t('common.outOfRange')
    case PositionStatus.CLOSED:
      return t('common.closed')
  }
  return undefined
}

export function parseProtocolVersion(version: string | undefined): ProtocolVersion | undefined {
  switch (version?.toLowerCase()) {
    case 'v2':
      return ProtocolVersion.V2
    case 'v3':
      return ProtocolVersion.V3
    case 'v4':
      return ProtocolVersion.V4
    default:
      return undefined
  }
}

export function parseV3FeeTier(feeTier: string | undefined): FeeAmount | undefined {
  const parsedFee = parseInt(feeTier || '')

  return parsedFee in FeeAmount ? parsedFee : undefined
}

export function getPoolFromRest({
  pool,
  token0,
  token1,
  protocolVersion,
}: {
  pool?: RestPool | PoolPosition
  token0?: Token
  token1?: Token
  protocolVersion: ProtocolVersion.V3
}): V3Pool | undefined
export function getPoolFromRest({
  pool,
  token0,
  token1,
  protocolVersion,
  hooks,
}: {
  pool?: RestPool | PoolPosition
  token0?: Currency
  token1?: Currency
  protocolVersion: ProtocolVersion.V4
  hooks: string
}): V4Pool | undefined
export function getPoolFromRest({
  pool,
  token0,
  token1,
  protocolVersion,
  hooks,
}:
  | {
      pool?: RestPool | PoolPosition
      token0?: Token
      token1?: Token
      protocolVersion: ProtocolVersion.V3
      hooks?: undefined
    }
  | {
      pool?: RestPool | PoolPosition
      token0?: Currency
      token1?: Currency
      protocolVersion: ProtocolVersion.V4
      hooks: string
    }): V3Pool | V4Pool | undefined {
  if (!pool || !token0 || !token1) {
    return undefined
  }

  if (pool instanceof RestPool) {
    if (protocolVersion === ProtocolVersion.V3) {
      return new V3Pool(token0 as Token, token1 as Token, pool.fee, pool.sqrtPriceX96, pool.liquidity, pool.tick)
    }

    return new V4Pool(
      token0,
      token1,
      pool.fee,
      pool.tickSpacing,
      hooks || ZERO_ADDRESS,
      pool.sqrtPriceX96,
      pool.liquidity,
      pool.tick,
    )
  }

  if (pool instanceof PoolPosition) {
    if (protocolVersion === ProtocolVersion.V3) {
      const feeTier = parseV3FeeTier(pool.feeTier)
      if (feeTier) {
        return new V3Pool(
          token0 as Token,
          token1 as Token,
          feeTier,
          pool.currentPrice,
          pool.currentLiquidity,
          parseInt(pool.currentTick),
        )
      }
    }

    const fee = parseInt(pool.feeTier ?? '')
    return new V4Pool(
      token0,
      token1,
      fee,
      parseInt(pool.tickSpacing),
      hooks || ZERO_ADDRESS,
      pool.currentPrice,
      pool.liquidity,
      parseInt(pool.currentTick),
    )
  }

  return undefined
}

function parseRestToken<T extends Currency>(token: RestToken | undefined): T | undefined {
  if (!token) {
    return undefined
  }

  if (token.address === ZERO_ADDRESS) {
    return nativeOnChain(token.chainId) as T
  }

  return new Token(token.chainId, token.address, token.decimals, token.symbol) as T
}

export function getPairFromRest({
  pair,
  token0,
  token1,
}: {
  pair?: PairPosition | RestPair
  token0: Token
  token1: Token
}): Pair | undefined {
  if (!pair) {
    return undefined
  }

  return new Pair(
    CurrencyAmount.fromRawAmount(token0, pair.reserve0),
    CurrencyAmount.fromRawAmount(token1, pair.reserve1),
  )
}

/**
 * @param position REST position with unknown version / fields.
 * @returns PositionInfo with the available fields parsed.
 */
export function parseRestPosition(position?: RestPosition): PositionInfo | undefined {
  if (position?.position.case === 'v2Pair') {
    const v2PairPosition = position.position.value
    const token0 = parseRestToken<Token>(v2PairPosition.token0)
    const token1 = parseRestToken<Token>(v2PairPosition.token1)
    const liquidityToken = parseRestToken<Token>(v2PairPosition.liquidityToken)
    if (!token0 || !token1 || !liquidityToken) {
      return undefined
    }

    const pair = getPairFromRest({ pair: position.position.value, token0, token1 })

    return {
      status: position.status,
      version: ProtocolVersion.V2,
      pair,
      liquidityToken,
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v2PairPosition.liquidity0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v2PairPosition.liquidity1),
      totalSupply: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.totalSupply),
      liquidityAmount: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.liquidity),
      v4hook: undefined,
      feeTier: undefined,
    }
  } else if (position?.position.case === 'v3Position') {
    const v3Position = position.position.value

    const token0 = parseRestToken<Token>(v3Position.token0)
    const token1 = parseRestToken<Token>(v3Position.token1)
    if (!token0 || !token1) {
      return undefined
    }

    const pool = getPoolFromRest({ pool: position.position.value, token0, token1, protocolVersion: ProtocolVersion.V3 })
    const sdkPosition = pool
      ? new V3Position({
          pool,
          liquidity: v3Position.liquidity,
          tickLower: Number(v3Position.tickLower),
          tickUpper: Number(v3Position.tickUpper),
        })
      : undefined

    return {
      status: position.status,
      feeTier: parseV3FeeTier(v3Position.feeTier),
      version: ProtocolVersion.V3,
      pool,
      position: sdkPosition,
      tickLower: v3Position.tickLower,
      tickUpper: v3Position.tickUpper,
      tickSpacing: Number(v3Position.tickSpacing),
      liquidity: v3Position.liquidity,
      tokenId: v3Position.tokenId,
      token0UncollectedFees: v3Position.token0UncollectedFees,
      token1UncollectedFees: v3Position.token1UncollectedFees,
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v3Position.amount0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v3Position.amount1),
      v4hook: undefined,
    }
  } else if (position?.position.case === 'v4Position') {
    const v4Position = position.position.value.poolPosition
    const token0 = parseRestToken<Currency>(v4Position?.token0)
    const token1 = parseRestToken<Currency>(v4Position?.token1)
    if (!v4Position || !token0 || !token1) {
      return undefined
    }

    const hook = position.position.value.hooks[0]?.address
    const pool = getPoolFromRest({ pool: v4Position, token0, token1, hooks: hook, protocolVersion: ProtocolVersion.V4 })

    const sdkPosition = pool
      ? new V4Position({
          pool,
          liquidity: v4Position.liquidity,
          tickLower: Number(v4Position.tickLower),
          tickUpper: Number(v4Position.tickUpper),
        })
      : undefined
    return {
      status: position.status,
      feeTier: v4Position?.feeTier,
      version: ProtocolVersion.V4,
      position: sdkPosition,
      pool,
      v4hook: hook,
      tokenId: v4Position.tokenId,
      tickLower: v4Position?.tickLower,
      tickUpper: v4Position?.tickUpper,
      tickSpacing: Number(v4Position?.tickSpacing),
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v4Position?.amount0 ?? 0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v4Position?.amount1 ?? 0),
      token0UncollectedFees: v4Position.token0UncollectedFees,
      token1UncollectedFees: v4Position.token1UncollectedFees,
      liquidity: v4Position.liquidity,
    }
  } else {
    return undefined
  }
}

export function calculateInvertedValues({
  token0CurrentPrice,
  token1CurrentPrice,
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  token0CurrentPrice?: Price<Currency, Currency>
  token1CurrentPrice?: Price<Currency, Currency>
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
  invert?: boolean
}): {
  currentPrice?: Price<Currency, Currency>
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
} {
  return {
    currentPrice: invert ? token1CurrentPrice : token0CurrentPrice,
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

export function calculateTickSpacingFromFeeAmount(feeAmount: number): number {
  return (2 * feeAmount) / 100
}

export function calculateInvertedPrice({ price, invert }: { price?: Price<Currency, Currency>; invert: boolean }) {
  const currentPrice = invert ? price?.invert() : price

  return {
    price: currentPrice,
    quote: currentPrice?.quoteCurrency,
    base: currentPrice?.baseCurrency,
  }
}
