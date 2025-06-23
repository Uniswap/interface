import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { Token } from '../../../generated/schema'
import { Mint as MintEvent } from '../../../generated/templates/Pool/Pool'
import { MATURE_MARKET, TVL_MULTIPLIER_THRESHOLD, WHITELIST_TOKENS } from '../../common/chain'
import { ONE_BI } from '../../common/constants'
import { getBundle, getFactory, getPool } from '../../common/entityGetters'
import { convertTokenToDecimal } from '../../common/utils'

export function handleMint(event: MintEvent): void {
  const bundle = getBundle()
  const poolAddress = event.address
  const pool = getPool(poolAddress)
  const factory = getFactory()

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  let amount0 = BigDecimal.zero()
  let amount1 = BigDecimal.zero()
  if (token0 && token1) {
    amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

    // reset tvl aggregates until new amounts calculated
    // KENT TODO: MOVE LOWER - AFTER CHECKING IF POOL APPROVED

    //update position

    // update globals
    factory.txCount = factory.txCount.plus(ONE_BI)

    // update token0 data
    token0.txCount = token0.txCount.plus(ONE_BI)
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
    token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

    // KENT TODO: CHECK IF APPROVED POOL HERE
    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI)
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
    token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI)

    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on mint if the new position includes the current tick.
    if (
      pool.tick &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.plus(event.params.amount)
    }

    if (pool.balanceOfBlock < event.block.number) {
      factory.totalValueLockedETH = factory.totalValueLockedETH.minus(pool.totalValueLockedETH)

      pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
      pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
      if (pool.totalValueLockedUSD.lt(BigDecimal.fromString(MATURE_MARKET))) {
        if (WHITELIST_TOKENS.includes(pool.token0.toHexString())) {
          const tvlNative0 = pool.totalValueLockedToken0.times(token0.derivedETH)
          const tvlNative1 = pool.totalValueLockedToken1.times(token1.derivedETH)

          if (tvlNative0.plus(tvlNative1).gt(tvlNative0.times(BigDecimal.fromString(TVL_MULTIPLIER_THRESHOLD)))) {
            pool.totalValueLockedETH = pool.totalValueLockedToken0
              .times(token0.derivedETH)
              .times(BigDecimal.fromString(TVL_MULTIPLIER_THRESHOLD))
          }
        }
        if (WHITELIST_TOKENS.includes(pool.token1.toHexString())) {
          const tvlNative1 = pool.totalValueLockedToken1.times(token1.derivedETH)
          const tvlNative0 = pool.totalValueLockedToken0.times(token0.derivedETH)

          if (tvlNative1.plus(tvlNative0).gt(tvlNative1.times(BigDecimal.fromString(TVL_MULTIPLIER_THRESHOLD)))) {
            pool.totalValueLockedETH = pool.totalValueLockedToken1
              .times(token1.derivedETH)
              .times(BigDecimal.fromString(TVL_MULTIPLIER_THRESHOLD))
          }
        }
      } else {
        pool.totalValueLockedETH = pool.totalValueLockedToken0
          .times(token0.derivedETH)
          .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
      }
      pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

      factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
      factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)
    }

    // Removed due to populating 0 value entities with no swaps in that interval.
    // updateTokenDayData(token0 as Token, event)
    // updateTokenDayData(token1 as Token, event)
    // updateTokenHourData(token0 as Token, event)
    // updateTokenHourData(token1 as Token, event)
    // updateTokenMinuteData(token0 as Token, event)
    // updateTokenMinuteData(token1 as Token, event)

    token0.save()
    token1.save()
    pool.save()
    factory.save()
  }
}
