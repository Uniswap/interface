import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ZERO_BD, ZERO_BI } from './constants'
import { convertTokenToDecimal } from './utils'
import { Pool, Position, PositionSnapshot, Token } from '../../generated/schema'

export function hexToBigint(hex: string): BigInt {
  let bigint = BigInt.fromI32(0)
  let power = BigInt.fromI32(1)
  for (let i = hex.length - 1; i >= 0; i--) {
    const char = hex.charCodeAt(i)
    let value = 0
    if (char >= 48 && char <= 57) {
      value = char - 48
    } else if (char >= 65 && char <= 70) {
      value = char - 55
    }
    bigint = bigint.plus(BigInt.fromI32(value).times(power))
    power = power.times(BigInt.fromI32(16))
  }
  return bigint
}

// https://github.com/Uniswap/v3-subgraph/pull/258

class PositionAmounts {
  amount0: BigDecimal
  amount1: BigDecimal
}

type EventOrcall = ethereum.Event
type TokenId = BigInt | null

/**
 * Gets or creates a position entity
 * @param owner The owner of the position
 * @param pool The pool address
 * @param tickLower The lower tick of the position
 * @param tickUpper The upper tick of the position
 * @param event The event that triggered this function
 * @returns The position entity
 */
export function getOrCreatePosition(
  owner: Address,
  pool: Pool,
  tickLower: BigInt,
  tickUpper: BigInt,
  event: EventOrcall,
  tokenId: TokenId
): Position {
  const positionId =
    owner.toHexString() + '-' + pool.id.toHexString() + '-' + tickLower.toString() + '-' + tickUpper.toString()
  let position = Position.load(positionId)

  if (position === null) {
    position = new Position(positionId)
    position.owner = owner
    position.pool = pool.id
    position.token0 = pool.token0
    position.token1 = pool.token1
    position.tickLower = tickLower
    position.tickUpper = tickUpper
    position.liquidity = ZERO_BI
    position.depositedToken0 = ZERO_BD
    position.depositedToken1 = ZERO_BD
    position.withdrawnToken0 = ZERO_BD
    position.withdrawnToken1 = ZERO_BD
    position.collectedFeesToken0 = ZERO_BD
    position.collectedFeesToken1 = ZERO_BD
    position.transaction = event.transaction.hash.toHexString()
    position.createdAtTimestamp = event.block.timestamp
    position.createdAtBlockNumber = event.block.number
    position.closed = false
    position.tokenId = tokenId
  }

  position.updatedAtTimestamp = event.block.timestamp
  position.updatedAtBlockNumber = event.block.number

  return position
}

/**
 * Updates a position with mint event data
 * @param position The position to update
 * @param amount The amount of liquidity added
 * @param amount0 The amount of token0 added
 * @param amount1 The amount of token1 added
 */
export function updatePositionWithMint(
  position: Position,
  amount: BigInt,
  amount0: BigDecimal,
  amount1: BigDecimal
): void {
  position.liquidity = position.liquidity.plus(amount)
  position.depositedToken0 = position.depositedToken0.plus(amount0)
  position.depositedToken1 = position.depositedToken1.plus(amount1)
}

/**
 * Updates a position with burn event data
 * @param position The position to update
 * @param amount The amount of liquidity removed
 * @param amount0 The amount of token0 removed
 * @param amount1 The amount of token1 removed
 */
export function updatePositionWithBurn(
  position: Position,
  amount: BigInt,
  amount0: BigDecimal,
  amount1: BigDecimal
): void {
  position.liquidity = position.liquidity.minus(amount)
  position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
  position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)

  // Mark position as closed if liquidity is zero
  if (position.liquidity.equals(ZERO_BI)) {
    position.closed = true
  }
}

/**
 * Updates a position with collect event data
 * @param position The position to update
 * @param amount0 The amount of token0 collected
 * @param amount1 The amount of token1 collected
 */
export function updatePositionWithCollect(position: Position, amount0: BigDecimal, amount1: BigDecimal): void {
  position.collectedFeesToken0 = position.collectedFeesToken0.plus(amount0)
  position.collectedFeesToken1 = position.collectedFeesToken1.plus(amount1)
}

/**
 * Convert a tick to a sqrt price (sqrtPriceX96)
 * @param tick The tick to convert
 * @returns The sqrt price as a BigInt
 */
export function tickToSqrtPriceX96(tick: BigInt): BigInt {
  // This is a simplified implementation
  // In a real implementation, you would use the full math from Uniswap V3
  const tickNum = tick.toI32()
  const price = Math.pow(1.0001, tickNum)
  const sqrtPrice = Math.sqrt(price)
  return BigInt.fromString((sqrtPrice * Math.pow(2, 96)).toString())
}

/**
 * Calculate amount of token0 for a given liquidity
 * @param sqrtRatioCurrentX96 The current sqrt price
 * @param sqrtRatioUpperX96 The upper sqrt price
 * @param liquidity The liquidity amount
 * @returns The amount of token0
 */
export function getAmount0ForLiquidity(
  sqrtRatioCurrentX96: BigInt,
  sqrtRatioUpperX96: BigInt,
  liquidity: BigInt
): BigInt {
  if (sqrtRatioCurrentX96.ge(sqrtRatioUpperX96)) {
    return ZERO_BI
  }

  const numerator = liquidity.times(BigInt.fromI32(2).pow(96)).times(sqrtRatioUpperX96.minus(sqrtRatioCurrentX96))
  const denominator = sqrtRatioUpperX96.times(sqrtRatioCurrentX96)

  return numerator.div(denominator)
}

/**
 * Calculate amount of token1 for a given liquidity
 * @param sqrtRatioLowerX96 The lower sqrt price
 * @param sqrtRatioCurrentX96 The current sqrt price
 * @param liquidity The liquidity amount
 * @returns The amount of token1
 */
export function getAmount1ForLiquidity(
  sqrtRatioLowerX96: BigInt,
  sqrtRatioCurrentX96: BigInt,
  liquidity: BigInt
): BigInt {
  if (sqrtRatioCurrentX96.le(sqrtRatioLowerX96)) {
    return ZERO_BI
  }

  return liquidity.times(sqrtRatioCurrentX96.minus(sqrtRatioLowerX96)).div(BigInt.fromI32(2).pow(96))
}

/**
 * Calculate the current amounts of token0 and token1 in a position
 * This uses the Uniswap V3 math to calculate the amounts based on the current price
 * @param position The position to calculate amounts for
 * @param pool The pool the position is in
 * @returns An object with amount0 and amount1
 */
export function calculatePositionAmounts(position: Position, pool: Pool): PositionAmounts {
  // If position is closed or has no liquidity, return zero
  if (position.closed || position.liquidity.equals(ZERO_BI)) {
    return { amount0: ZERO_BD, amount1: ZERO_BD }
  }

  const token0 = Token.load(pool.token0)!
  const token1 = Token.load(pool.token1)!

  // Get the current sqrt price from the pool
  const sqrtPriceX96 = pool.sqrtPrice

  // Convert ticks to sqrt prices
  const sqrtPriceX96Lower = tickToSqrtPriceX96(position.tickLower)
  const sqrtPriceX96Upper = tickToSqrtPriceX96(position.tickUpper)

  // Calculate amounts using Uniswap V3 math
  let amount0 = ZERO_BD
  let amount1 = ZERO_BD

  if (pool.tick !== null) {
    const currentTick = pool.tick as BigInt

    if (currentTick.lt(position.tickLower)) {
      // Current price is below the position's range
      // Only token0 is in the position
      amount0 = convertTokenToDecimal(
        getAmount0ForLiquidity(sqrtPriceX96Lower, sqrtPriceX96Upper, position.liquidity),
        token0.decimals
      )
    } else if (currentTick.ge(position.tickUpper)) {
      // Current price is above the position's range
      // Only token1 is in the position
      amount1 = convertTokenToDecimal(
        getAmount1ForLiquidity(sqrtPriceX96Lower, sqrtPriceX96Upper, position.liquidity),
        token1.decimals
      )
    } else {
      // Current price is within the position's range
      // Both tokens are in the position
      amount0 = convertTokenToDecimal(
        getAmount0ForLiquidity(sqrtPriceX96, sqrtPriceX96Upper, position.liquidity),
        token0.decimals
      )
      amount1 = convertTokenToDecimal(
        getAmount1ForLiquidity(sqrtPriceX96Lower, sqrtPriceX96, position.liquidity),
        token1.decimals
      )
    }
  } else {
    // If tick is null, use a simplified approach
    // Get current amounts by subtracting withdrawn from deposited
    amount0 = position.depositedToken0.minus(position.withdrawnToken0)
    amount1 = position.depositedToken1.minus(position.withdrawnToken1)
  }

  return { amount0, amount1 }
}

/**
 * Create a snapshot of a position
 * @param position The position to snapshot
 * @param event The event that triggered the snapshot
 * @returns The position snapshot
 */
export function createPositionSnapshot(position: Position, event: ethereum.Event): PositionSnapshot {
  const snapshotId = position.id + '-' + event.block.number.toString()

  const snapshot = new PositionSnapshot(snapshotId)
  snapshot.owner = position.owner
  snapshot.pool = position.pool
  snapshot.position = position.id
  snapshot.blockNumber = event.block.number
  snapshot.timestamp = event.block.timestamp
  snapshot.liquidity = position.liquidity
  snapshot.depositedToken0 = position.depositedToken0
  snapshot.depositedToken1 = position.depositedToken1
  snapshot.withdrawnToken0 = position.withdrawnToken0
  snapshot.withdrawnToken1 = position.withdrawnToken1
  snapshot.collectedFeesToken0 = position.collectedFeesToken0
  snapshot.collectedFeesToken1 = position.collectedFeesToken1
  snapshot.transaction = event.transaction.hash.toHexString()
  snapshot.tokenId = position.tokenId

  snapshot.save()

  return snapshot
}
