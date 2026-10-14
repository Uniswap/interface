import { Position as LiquidityServicePosition } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { parseLiquidityServicePosition } from 'uniswap/src/features/positions/parseLiquidityServicePosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import type { ValidatedDecreasePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'

export const LIQUIDITY_SERVICE_POSITION_OWNER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

/**
 * A mainnet ETH/USDT v4 full-range position as the liquidity service reports it. Token amounts are derived
 * from `liquidity` against the pool's sqrtPrice, so changing `liquidity` changes the parsed currency amounts.
 */
export function buildLiquidityServicePosition({ liquidity }: { liquidity: string }): LiquidityServicePosition {
  return LiquidityServicePosition.fromJson({
    version: 'V4',
    chainId: 1,
    owner: LIQUIDITY_SERVICE_POSITION_OWNER,
    tokenId: '13281',
    poolAddressOrId: '0x72331fcb696b0151904c03584b66dc8365bc63f8a144d89a773384e3a579ca73',
    feeTier: 500,
    tickLower: -887270,
    tickUpper: 887270,
    liquidity,
    status: 'POSITION_STATUS_OPEN',
    token0Address: '0x0000000000000000000000000000000000000000',
    token0Metadata: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    token1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    token1Metadata: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    hookAddress: '0x0000000000000000000000000000000000000000',
    tickSpacing: 10,
    currentTick: -202299,
    sqrtPriceX96: '3207989918599918700969750',
    poolLiquidity: '20745140031091761',
    token0UncollectedFees: '12000000000000000',
    token1UncollectedFees: '41500000',
  })
}

export function buildPositionInfo({ liquidity }: { liquidity: string }): PositionInfo {
  const info = parseLiquidityServicePosition(buildLiquidityServicePosition({ liquidity }))
  if (!info) {
    throw new Error('liquidity-service position fixture failed to parse')
  }
  return info
}

/** The validated decrease the review screen hands the saga: a full withdrawal of `positionInfo`, no approvals. */
export function buildDecreaseTxContext(positionInfo: PositionInfo): ValidatedDecreasePositionTxAndGasInfo {
  return {
    type: LiquidityTransactionType.Decrease,
    canBatchTransactions: false,
    delegatedAddress: null,
    action: {
      type: LiquidityTransactionType.Decrease,
      currency0Amount: positionInfo.currency0Amount,
      currency1Amount: positionInfo.currency1Amount,
      liquidityToken: positionInfo.liquidityToken,
    },
    txRequest: { to: '0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e', chainId: 1, data: '0x' },
    approvePositionTokenRequest: undefined,
    approveToken0Request: undefined,
    approveToken1Request: undefined,
    revokeToken0Request: undefined,
    revokeToken1Request: undefined,
    token0PermitTransaction: undefined,
    token1PermitTransaction: undefined,
    positionTokenPermitTransaction: undefined,
    permit: undefined,
  }
}
