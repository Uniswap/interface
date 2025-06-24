import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { PositionInfo } from 'components/Liquidity/types'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GetPositionsQuery } from 'v3-subgraph/generated/types-and-hooks'

// Helper function to convert decimal string to BigInt with proper decimals
function parseTokenAmount(amount: string, decimals: number): JSBI {
  if (!amount || amount === '0') return JSBI.BigInt(0)

  try {
    // Convert decimal string to wei/smallest unit using parseUnits
    const parsed = parseUnits(amount, decimals)
    return JSBI.BigInt(parsed.toString())
  } catch (error) {
    console.warn(`Failed to parse amount ${amount} with decimals ${decimals}:`, error)
    return JSBI.BigInt(0)
  }
}

export const fromPositionToPositionInfo = (position: GetPositionsQuery['positions'][0]): PositionInfo => {
  // Create Token instances
  const token0 = new Token(
    UniverseChainId.SmartBCH,
    position.pool.token0.id,
    parseInt(position.pool.token0.decimals),
    position.pool.token0.symbol,
    position.pool.token0.name,
  )

  const token1 = new Token(
    UniverseChainId.SmartBCH,
    position.pool.token1.id,
    parseInt(position.pool.token1.decimals),
    position.pool.token1.symbol,
    position.pool.token1.name,
  )

  // Parse amounts properly with decimals
  const depositedAmount0 = parseTokenAmount(position.depositedToken0, token0.decimals)
  const depositedAmount1 = parseTokenAmount(position.depositedToken1, token1.decimals)
  const withdrawnAmount0 = parseTokenAmount(position.withdrawnToken0 || '0', token0.decimals)
  const withdrawnAmount1 = parseTokenAmount(position.withdrawnToken1 || '0', token1.decimals)

  // Calculate current amounts (deposited - withdrawn)
  const currentAmount0 = JSBI.subtract(depositedAmount0, withdrawnAmount0)
  const currentAmount1 = JSBI.subtract(depositedAmount1, withdrawnAmount1)

  // Ensure amounts are not negative
  const finalAmount0 = JSBI.greaterThan(currentAmount0, JSBI.BigInt(0)) ? currentAmount0 : JSBI.BigInt(0)
  const finalAmount1 = JSBI.greaterThan(currentAmount1, JSBI.BigInt(0)) ? currentAmount1 : JSBI.BigInt(0)

  // Create CurrencyAmount instances
  const currency0Amount = CurrencyAmount.fromRawAmount(token0, finalAmount0)
  const currency1Amount = CurrencyAmount.fromRawAmount(token1, finalAmount1)

  // Calculate if position is in range
  const currentTick = parseInt(position.pool.tick)
  const tickLower = parseInt(position.tickLower)
  const tickUpper = parseInt(position.tickUpper)
  const inRange = currentTick >= tickLower && currentTick <= tickUpper

  // Determine status
  let status: PositionStatus
  if (position.closed || position.liquidity === '0') {
    status = PositionStatus.CLOSED
  } else if (inRange) {
    status = PositionStatus.IN_RANGE
  } else {
    status = PositionStatus.OUT_OF_RANGE
  }

  return {
    chainId: UniverseChainId.SmartBCH,
    owner: position.owner,
    currency0Amount,
    currency1Amount,
    poolId: position.pool.id,
    version: ProtocolVersion.V3,
    status,
    apr: calculatePositionAPR(position), // Calculate separately if needed
    v4hook: undefined,
    tokenId: position.id,
  }
}

function calculatePositionAPR(position: GetPositionsQuery['positions'][0]): number {
  // Simplified APR calculation
  // In reality, you'd want to:
  // 1. Calculate the position's share of the pool
  // 2. Estimate fees earned based on volume and fee tier
  // 3. Annualize the return

  const poolFeesUSD = parseFloat(position.pool.feesUSD || '0')
  const poolTVL = parseFloat(position.pool.totalValueLockedUSD || '0')

  if (poolTVL === 0) return 0

  // Rough APR calculation (fees / TVL * 365 * 100)
  const dailyAPR = poolFeesUSD / 365 / poolTVL
  return dailyAPR * 365 * 100
}
