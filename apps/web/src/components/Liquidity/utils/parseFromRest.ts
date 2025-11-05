import {
  PairPosition,
  PoolPosition,
  ProtocolVersion,
  Pair as RestPair,
  Pool as RestPool,
  Position as RestPosition,
  Token as RestToken,
} from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolInformation } from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { DYNAMIC_FEE_DATA, FeeData } from 'components/Liquidity/Create/types'
import { PositionInfo } from 'components/Liquidity/types'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { logger } from 'utilities/src/logger/logger'

function parseV3FeeTier(feeTier: number | string | undefined): FeeData | undefined {
  const parsedFee = Number(feeTier || '')

  return parsedFee in FeeAmount
    ? { feeAmount: parsedFee, tickSpacing: DEFAULT_TICK_SPACING, isDynamic: false }
    : undefined
}

function getSDKPoolFromPoolPosition({
  pool,
  token0,
  token1,
  protocolVersion,
}: {
  pool?: PoolPosition
  token0?: Token
  token1?: Token
  protocolVersion: ProtocolVersion.V3
}): V3Pool | undefined
function getSDKPoolFromPoolPosition({
  pool,
  token0,
  token1,
  protocolVersion,
  hooks,
}: {
  pool?: PoolPosition
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  protocolVersion: ProtocolVersion.V4
  hooks: string
}): V4Pool | undefined
function getSDKPoolFromPoolPosition({
  pool,
  token0,
  token1,
  protocolVersion,
  hooks,
}:
  | {
      pool?: PoolPosition
      token0?: Token
      token1?: Token
      protocolVersion: ProtocolVersion.V3
      hooks?: undefined
    }
  | {
      pool?: PoolPosition
      token0: Maybe<Currency>
      token1: Maybe<Currency>
      protocolVersion: ProtocolVersion.V4
      hooks: string
    }): V3Pool | V4Pool | undefined {
  if (!pool || !token0 || !token1) {
    return undefined
  }

  if (protocolVersion === ProtocolVersion.V3) {
    const feeTier = parseV3FeeTier(pool.feeTier)
    if (feeTier) {
      return new V3Pool(
        token0 as Token,
        token1 as Token,
        feeTier.feeAmount,
        pool.currentPrice,
        pool.currentLiquidity,
        parseInt(pool.currentTick),
      )
    }

    return undefined
  }

  const fee = parseInt(pool.feeTier)
  return new V4Pool(
    token0,
    token1,
    fee,
    parseInt(pool.tickSpacing),
    hooks || ZERO_ADDRESS,
    pool.currentPrice,
    pool.currentLiquidity,
    parseInt(pool.currentTick),
  )
}

export function getV4SDKPoolFromRestPool({
  pool,
  token0,
  token1,
  hooks,
}: {
  pool?: RestPool
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  hooks: string
}): V4Pool | undefined {
  if (!pool || !token0 || !token1) {
    return undefined
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

export function getSDKPoolFromPoolInformation({
  poolOrPair,
  token0,
  token1,
  protocolVersion,
}: {
  poolOrPair?: PoolInformation
  token0?: Token
  token1?: Token
  protocolVersion: ProtocolVersion.V2
}): Pair | undefined
export function getSDKPoolFromPoolInformation({
  poolOrPair,
  token0,
  token1,
  protocolVersion,
}: {
  poolOrPair?: PoolInformation
  token0?: Token
  token1?: Token
  protocolVersion: ProtocolVersion.V3
}): V3Pool | undefined
export function getSDKPoolFromPoolInformation({
  poolOrPair,
  token0,
  token1,
  protocolVersion,
  hooks,
}: {
  poolOrPair?: PoolInformation
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  protocolVersion: ProtocolVersion.V4
  hooks: string
}): V4Pool | undefined
export function getSDKPoolFromPoolInformation({
  poolOrPair,
  token0,
  token1,
  protocolVersion,
  hooks,
}:
  | {
      poolOrPair?: PoolInformation
      token0?: Token
      token1?: Token
      protocolVersion: ProtocolVersion.V2
      hooks?: undefined
    }
  | {
      poolOrPair?: PoolInformation
      token0?: Token
      token1?: Token
      protocolVersion: ProtocolVersion.V3
      hooks?: undefined
    }
  | {
      poolOrPair?: PoolInformation
      token0: Maybe<Currency>
      token1: Maybe<Currency>
      protocolVersion: ProtocolVersion.V4
      hooks: string
    }): V3Pool | V4Pool | Pair | undefined {
  if (!poolOrPair || !token0 || !token1) {
    return undefined
  }
  if (protocolVersion === ProtocolVersion.V2) {
    return new Pair(
      CurrencyAmount.fromRawAmount(token0, poolOrPair.token0Reserves ?? '0'),
      CurrencyAmount.fromRawAmount(token1, poolOrPair.token1Reserves ?? '0'),
    )
  }

  if (protocolVersion === ProtocolVersion.V3) {
    return new V3Pool(
      token0 as Token,
      token1 as Token,
      parseV3FeeTier(poolOrPair.fee)?.feeAmount ?? FeeAmount.MEDIUM,
      poolOrPair.sqrtRatioX96 ?? '0',
      poolOrPair.poolLiquidity ?? '0',
      poolOrPair.currentTick ?? 0,
    )
  }

  return new V4Pool(
    token0,
    token1,
    poolOrPair.fee ?? FeeAmount.MEDIUM,
    poolOrPair.tickSpacing ?? DEFAULT_TICK_SPACING,
    hooks || ZERO_ADDRESS,
    poolOrPair.sqrtRatioX96 ?? '0',
    poolOrPair.poolLiquidity ?? '0',
    poolOrPair.currentTick ?? 0,
  )
}

function parseRestToken<T extends Currency>(token: RestToken | undefined): T | undefined {
  if (!token) {
    return undefined
  }

  if (token.address === ZERO_ADDRESS) {
    return nativeOnChain(token.chainId) as T
  }

  return new Token(token.chainId, token.address, token.decimals, token.symbol, token.name) as T
}

function getPairFromRest({
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
  try {
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
        poolOrPair: pair,
        liquidityToken,
        chainId: token0.chainId,
        poolId: liquidityToken.address,
        currency0Amount: CurrencyAmount.fromRawAmount(token0, v2PairPosition.liquidity0),
        currency1Amount: CurrencyAmount.fromRawAmount(token1, v2PairPosition.liquidity1),
        totalSupply: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.totalSupply),
        liquidityAmount: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.liquidity),
        apr: v2PairPosition.apr,
        v4hook: undefined,
        feeTier: undefined,
        owner: undefined,
        isHidden: position.isHidden,
      }
    } else if (position?.position.case === 'v3Position') {
      const v3Position = position.position.value

      const token0 = parseRestToken<Token>(v3Position.token0)
      const token1 = parseRestToken<Token>(v3Position.token1)
      if (!token0 || !token1) {
        return undefined
      }

      const pool = getSDKPoolFromPoolPosition({
        pool: position.position.value,
        token0,
        token1,
        protocolVersion: ProtocolVersion.V3,
      })
      const sdkPosition = pool
        ? new V3Position({
            pool,
            liquidity: v3Position.liquidity,
            tickLower: Number(v3Position.tickLower),
            tickUpper: Number(v3Position.tickUpper),
          })
        : undefined
      const fee0Amount = CurrencyAmount.fromRawAmount(token0, v3Position.token0UncollectedFees)
      const fee1Amount = CurrencyAmount.fromRawAmount(token1, v3Position.token1UncollectedFees)

      return {
        status: position.status,
        feeTier: parseV3FeeTier(v3Position.feeTier),
        version: ProtocolVersion.V3,
        chainId: token0.chainId,
        poolOrPair: pool,
        poolId: position.position.value.poolId,
        position: sdkPosition,
        tickLower: Number(v3Position.tickLower),
        tickUpper: Number(v3Position.tickUpper),
        tickSpacing: Number(v3Position.tickSpacing),
        liquidity: v3Position.liquidity,
        tokenId: v3Position.tokenId,
        token0UncollectedFees: v3Position.token0UncollectedFees,
        token1UncollectedFees: v3Position.token1UncollectedFees,
        fee0Amount,
        fee1Amount,
        currency0Amount: CurrencyAmount.fromRawAmount(token0, v3Position.amount0),
        currency1Amount: CurrencyAmount.fromRawAmount(token1, v3Position.amount1),
        apr: v3Position.apr,
        v4hook: undefined,
        owner: v3Position.owner,
        isHidden: position.isHidden,
      }
    } else if (position?.position.case === 'v4Position') {
      const v4Position = position.position.value.poolPosition
      const token0 = parseRestToken<Currency>(v4Position?.token0)
      const token1 = parseRestToken<Currency>(v4Position?.token1)
      if (!v4Position || !token0 || !token1) {
        return undefined
      }

      const hook = position.position.value.hooks[0]?.address
      const pool = getSDKPoolFromPoolPosition({
        pool: v4Position,
        token0,
        token1,
        hooks: hook,
        protocolVersion: ProtocolVersion.V4,
      })

      const sdkPosition = pool
        ? new V4Position({
            pool,
            liquidity: v4Position.liquidity,
            tickLower: Number(v4Position.tickLower),
            tickUpper: Number(v4Position.tickUpper),
          })
        : undefined
      const poolId = V4Pool.getPoolId(token0, token1, Number(v4Position.feeTier), Number(v4Position.tickSpacing), hook)
      const fee0Amount = CurrencyAmount.fromRawAmount(token0, v4Position.token0UncollectedFees)
      const fee1Amount = CurrencyAmount.fromRawAmount(token1, v4Position.token1UncollectedFees)
      return {
        status: position.status,
        feeTier: {
          feeAmount: v4Position.isDynamicFee ? DYNAMIC_FEE_DATA.feeAmount : Number(v4Position.feeTier),
          tickSpacing: Number(v4Position.tickSpacing),
          isDynamic: v4Position.isDynamicFee,
        },
        version: ProtocolVersion.V4,
        position: sdkPosition,
        chainId: token0.chainId,
        poolOrPair: pool,
        poolId,
        v4hook: hook,
        tokenId: v4Position.tokenId,
        tickLower: Number(v4Position.tickLower),
        tickUpper: Number(v4Position.tickUpper),
        tickSpacing: Number(v4Position.tickSpacing),
        currency0Amount: CurrencyAmount.fromRawAmount(token0, v4Position.amount0),
        currency1Amount: CurrencyAmount.fromRawAmount(token1, v4Position.amount1),
        token0UncollectedFees: v4Position.token0UncollectedFees,
        token1UncollectedFees: v4Position.token1UncollectedFees,
        fee0Amount,
        fee1Amount,
        liquidity: v4Position.liquidity,
        apr: v4Position.apr,
        owner: v4Position.owner,
        isHidden: position.isHidden,
        totalApr: position.position.value.poolPosition?.totalApr,
        unclaimedRewardsAmountUni: position.position.value.poolPosition?.unclaimedRewardsAmountUni,
        boostedApr: position.position.value.poolPosition?.boostedApr,
      }
    } else {
      return undefined
    }
  } catch (e) {
    logger.error(e, {
      tags: {
        file: 'Liquidity/utils.tsx',
        function: 'parseRestPosition',
      },
      extra: {
        ...position,
      },
    })
    return undefined
  }
}
