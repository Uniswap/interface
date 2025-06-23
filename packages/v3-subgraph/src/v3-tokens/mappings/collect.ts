/* eslint-disable prefer-const */
import { Address, BigDecimal } from '@graphprotocol/graph-ts'

import { ERC20 } from '../../../generated/templates/Pool/ERC20'
import { Collect as CollectEvent } from '../../../generated/templates/Pool/Pool'
import { MATURE_MARKET, TVL_MULTIPLIER_THRESHOLD, WHITELIST_TOKENS } from '../../common/chain'
import { ONE_BI, ZERO_BD } from '../../common/constants'
import { getBundle, getFactory, getPool, getToken } from '../../common/entityGetters'
import { convertTokenToDecimal } from '../../common/utils'

// @TODO Prior NonfungiblePositionManager Collect code, to be updated to Pool collect code
export function handleCollect(event: CollectEvent): void {
  let bundle = getBundle()
  let factory = getFactory()
  let pool = getPool(event.address)
  let token0 = getToken(pool.token0)
  let token1 = getToken(pool.token1)

  // reset aggregate tvl before individual pool tvl updates

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  // KENT TODO: MOVE LOWER - AFTER CHECKING IF POOL APPROVED
  pool.txCount = pool.txCount.plus(ONE_BI)
  factory.txCount = factory.txCount.plus(ONE_BI)
  token0.txCount = token0.txCount.plus(ONE_BI)
  token1.txCount = token1.txCount.plus(ONE_BI)

  if (pool.balanceOfBlock < event.block.number) {
    let currentPoolTvlETH = pool.totalValueLockedETH
    factory.totalValueLockedETH = factory.totalValueLockedETH.minus(currentPoolTvlETH)
    // pool data
    let tvlToken0 = pool.totalValueLockedToken0.minus(amount0)
    let tvlToken1 = pool.totalValueLockedToken1.minus(amount1)

    let tvlToken0Actual = tvlToken0
    let tvlToken1Actual = tvlToken1
    if (tvlToken0.lt(ZERO_BD) || tvlToken1.lt(ZERO_BD)) {
      let balanceCall0 = ERC20.bind(Address.fromBytes(token0.id)).try_balanceOf(Address.fromBytes(pool.id))
      if (!balanceCall0.reverted) {
        tvlToken0Actual = convertTokenToDecimal(balanceCall0.value, token0.decimals)
        pool.balanceOfBlock = event.block.number
      }

      let balanceCall1 = ERC20.bind(Address.fromBytes(token1.id)).try_balanceOf(Address.fromBytes(pool.id))
      if (!balanceCall1.reverted) {
        tvlToken1Actual = convertTokenToDecimal(balanceCall1.value, token1.decimals)
        pool.balanceOfBlock = event.block.number
      }
    }
    pool.totalValueLockedToken0 = tvlToken0Actual
    pool.totalValueLockedToken1 = tvlToken1Actual
    if (pool.totalValueLockedUSD.lt(BigDecimal.fromString(MATURE_MARKET))) {
      if (WHITELIST_TOKENS.includes(pool.token0.toHexString())) {
        let tvlNative0 = pool.totalValueLockedToken0.times(token0.derivedETH)
        let tvlNative1 = pool.totalValueLockedToken1.times(token1.derivedETH)

        if (tvlNative0.plus(tvlNative1).gt(tvlNative0.times(BigDecimal.fromString(TVL_MULTIPLIER_THRESHOLD)))) {
          pool.totalValueLockedETH = pool.totalValueLockedToken0
            .times(token0.derivedETH)
            .times(BigDecimal.fromString(TVL_MULTIPLIER_THRESHOLD))
        }
      }
      if (WHITELIST_TOKENS.includes(pool.token1.toHexString())) {
        let tvlNative1 = pool.totalValueLockedToken1.times(token1.derivedETH)
        let tvlNative0 = pool.totalValueLockedToken0.times(token0.derivedETH)

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
    // KENT TODO: MOVE LOWER - AFTER CHECKING IF POOL APPROVED
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)
  }
  token0.totalValueLocked = token0.totalValueLocked.minus(amount0)
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

  token1.totalValueLocked = token1.totalValueLocked.minus(amount1)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

  factory.save()
  pool.save()
  token0.save()
  token1.save()
}
