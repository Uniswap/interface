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
import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk'
import { PositionInfo } from 'components/Liquidity/types'
import { getPriceOrderingFromPositionForUI } from 'components/PositionListItem'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { AppTFunction } from 'ui/src/i18n/types'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'

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
}: {
  pool?: RestPool | PoolPosition
  token0?: Token
  token1?: Token
}): Pool | undefined {
  if (!pool || !token0 || !token1) {
    return undefined
  }

  if (pool instanceof RestPool) {
    return new Pool(token0, token1, pool.fee, pool.sqrtPriceX96, pool.liquidity, pool.tick)
  }

  if (pool instanceof PoolPosition) {
    const feeTier = parseV3FeeTier(pool.feeTier)
    if (feeTier) {
      return new Pool(token0, token1, feeTier, pool.currentPrice, pool.liquidity, parseInt(pool.currentTick))
    }
  }

  return undefined
}

function parseRestToken(token?: RestToken): Token | undefined {
  if (!token) {
    return undefined
  }
  return new Token(token.chainId, token.address, token.decimals, token.symbol)
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
    const token0 = parseRestToken(v2PairPosition.token0)
    const token1 = parseRestToken(v2PairPosition.token1)
    const liquidityToken = parseRestToken(v2PairPosition.liquidityToken)
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

    const token0 = parseRestToken(v3Position.token0)
    const token1 = parseRestToken(v3Position.token1)
    if (!token0 || !token1) {
      return undefined
    }

    const pool = getPoolFromRest({ pool: position.position.value, token0, token1 })
    const sdkPosition = pool
      ? new Position({
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
    const token0 = parseRestToken(v4Position?.token0)
    const token1 = parseRestToken(v4Position?.token1)
    if (!v4Position || !token0 || !token1) {
      return undefined
    }

    return {
      status: position.status,
      feeTier: v4Position?.feeTier,
      version: ProtocolVersion.V4,
      position: undefined, // add support for this
      v4hook: position.position.value.hooks[0]?.address,
      tokenId: v4Position.tokenId,
      tickLower: v4Position?.tickLower,
      tickUpper: v4Position?.tickUpper,
      tickSpacing: Number(v4Position?.tickSpacing),
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v4Position?.amount0 ?? 0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v4Position?.amount1 ?? 0),
    }
  } else {
    return undefined
  }
}

/**
 * Parses the Positions API object from the modal state and returns the relevant information for the modals.
 */
export function useModalLiquidityPositionInfo(): PositionInfo | undefined {
  const modalState = useAppSelector((state) => state.application.openModal)
  return modalState?.initialState
}

export function useGetPoolTokenPercentage(positionInfo?: PositionInfo) {
  const { totalSupply, liquidityAmount } = positionInfo ?? {}

  const poolTokenPercentage = useMemo(() => {
    return !!liquidityAmount && !!totalSupply && JSBI.greaterThanOrEqual(totalSupply.quotient, liquidityAmount.quotient)
      ? new Percent(liquidityAmount.quotient, totalSupply.quotient)
      : undefined
  }, [liquidityAmount, totalSupply])

  return poolTokenPercentage
}

/**
 * V3-specific hooks for a position parsed using parseRestPosition.
 */
export function useV3PositionDerivedInfo(positionInfo?: PositionInfo) {
  const {
    token0UncollectedFees,
    token1UncollectedFees,
    currency0Amount,
    currency1Amount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionInfo ?? {}
  // TODO(WEB-4920): construct Pool object from backend data rather than using multicall
  const { price: price0 } = useUSDCPrice(currency0Amount?.currency)
  const { price: price1 } = useUSDCPrice(currency1Amount?.currency)

  const { feeValue0, feeValue1 } = useMemo(() => {
    if (!currency0Amount || !currency1Amount) {
      return {}
    }
    return {
      feeValue0: token0UncollectedFees
        ? CurrencyAmount.fromRawAmount(currency0Amount.currency, token0UncollectedFees)
        : undefined,
      feeValue1: token1UncollectedFees
        ? CurrencyAmount.fromRawAmount(currency1Amount.currency, token1UncollectedFees)
        : undefined,
    }
  }, [currency0Amount, currency1Amount, token0UncollectedFees, token1UncollectedFees])

  const { fiatFeeValue0, fiatFeeValue1 } = useMemo(() => {
    if (!price0 || !price1 || !currency0Amount || !currency1Amount || !feeValue0 || !feeValue1) {
      return {}
    }

    const amount0 = price0.quote(feeValue0.wrapped)
    const amount1 = price1.quote(feeValue1.wrapped)
    return {
      fiatFeeValue0: amount0,
      fiatFeeValue1: amount1,
    }
  }, [price0, price1, currency0Amount, currency1Amount, feeValue0, feeValue1])

  const { fiatValue0, fiatValue1 } = useMemo(() => {
    if (!price0 || !price1 || !currency0Amount || !currency1Amount) {
      return {}
    }
    const amount0 = price0.quote(currency0Amount)
    const amount1 = price1.quote(currency1Amount)
    return {
      fiatValue0: amount0,
      fiatValue1: amount1,
    }
  }, [price0, price1, currency0Amount, currency1Amount])

  const priceOrdering = useMemo(() => {
    if (
      positionInfo?.version !== ProtocolVersion.V3 ||
      !positionInfo.position ||
      !liquidity ||
      !tickLower ||
      !tickUpper
    ) {
      return {}
    }
    return getPriceOrderingFromPositionForUI(positionInfo.position)
  }, [liquidity, tickLower, tickUpper, positionInfo])

  return useMemo(
    () => ({
      fiatFeeValue0,
      fiatFeeValue1,
      fiatValue0,
      fiatValue1,
      priceOrdering,
      feeValue0,
      feeValue1,
      token0CurrentPrice: positionInfo?.version === ProtocolVersion.V3 ? positionInfo.pool?.token0Price : undefined,
      token1CurrentPrice: positionInfo?.version === ProtocolVersion.V3 ? positionInfo.pool?.token0Price : undefined,
    }),
    [fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, priceOrdering, feeValue0, feeValue1, positionInfo],
  )
}
