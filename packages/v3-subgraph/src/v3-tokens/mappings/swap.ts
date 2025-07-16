import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { Token } from '../../../generated/schema'
import { Swap as SwapEvent } from '../../../generated/templates/Pool/Pool'
import { MATURE_MARKET, TVL_MULTIPLIER_THRESHOLD, WHITELIST_TOKENS } from '../../common/chain'
import { ONE_BI, ZERO_BD } from '../../common/constants'
import { getBundle, getFactory, getPool } from '../../common/entityGetters'
import { findEthPerToken, getEthPriceInUSD, getTrackedAmountUSD, sqrtPriceX96ToTokenPrices } from '../../common/pricing'
import { convertTokenToDecimal, safeDiv } from '../../common/utils'
import { updateTokenDayData, updateTokenHourData, updateTokenMinuteData } from './intervalUpdates'

export function handleSwap(event: SwapEvent): void {
  const bundle = getBundle()
  const factory = getFactory()
  const pool = getPool(event.address)
  if (pool && bundle && factory) {
    // hot fix for bad pricing
    // if (pool.id == Address.fromString('0x9663f2ca0454accad3e094448ea6f77443880454')) {
    //   return
    // }

    const token0 = Token.load(pool.token0)
    const token1 = Token.load(pool.token1)
    if (token0 && token1) {
      // amounts - 0/1 are token deltas: can be positive or negative
      const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
      const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

      // need absolute amounts for volume
      let amount0Abs = amount0
      if (amount0.lt(ZERO_BD)) {
        amount0Abs = amount0.times(BigDecimal.fromString('-1'))
      }
      let amount1Abs = amount1
      if (amount1.lt(ZERO_BD)) {
        amount1Abs = amount1.times(BigDecimal.fromString('-1'))
      }
      const amount0ETH = amount0Abs.times(token0.derivedETH)
      const amount1ETH = amount1Abs.times(token1.derivedETH)
      const amount0USD = amount0ETH.times(bundle.ethPriceUSD)
      const amount1USD = amount1ETH.times(bundle.ethPriceUSD)

      // get amount that should be tracked only - div 2 because cant count both input and output as volume
      const amountTotalUSDTracked = getTrackedAmountUSD(amount0Abs, token0 as Token, amount1Abs, token1 as Token).div(
        BigDecimal.fromString('2')
      )
      const amountTotalETHTracked = safeDiv(amountTotalUSDTracked, bundle.ethPriceUSD)
      const amountTotalUSDUntracked = amount0USD.plus(amount1USD).div(BigDecimal.fromString('2'))

      const feesETH = amountTotalETHTracked.times(pool.feeTier.toBigDecimal()).div(BigDecimal.fromString('1000000'))
      const feesUSD = amountTotalUSDTracked.times(pool.feeTier.toBigDecimal()).div(BigDecimal.fromString('1000000'))

      // global updates
      // KENT TODO: MOVE LOWER - AFTER CHECKING IF POOL APPROVED
      factory.txCount = factory.txCount.plus(ONE_BI)
      factory.totalVolumeETH = factory.totalVolumeETH.plus(amountTotalETHTracked)
      factory.totalVolumeUSD = factory.totalVolumeUSD.plus(amountTotalUSDTracked)
      factory.untrackedVolumeUSD = factory.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
      factory.totalFeesETH = factory.totalFeesETH.plus(feesETH)
      factory.totalFeesUSD = factory.totalFeesUSD.plus(feesUSD)

      // reset aggregate tvl before individual pool tvl updates
      const currentPoolTvlETH = pool.totalValueLockedETH
      // KENT TODO: MOVE LOWER - AFTER CHECKING IF POOL APPROVED
      if (pool.balanceOfBlock < event.block.number) {
        factory.totalValueLockedETH = factory.totalValueLockedETH.minus(currentPoolTvlETH)
      }
      // pool volume
      pool.volumeToken0 = pool.volumeToken0.plus(amount0Abs)
      pool.volumeToken1 = pool.volumeToken1.plus(amount1Abs)
      pool.volumeUSD = pool.volumeUSD.plus(amountTotalUSDTracked)
      pool.untrackedVolumeUSD = pool.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
      pool.feesUSD = pool.feesUSD.plus(feesUSD)
      pool.txCount = pool.txCount.plus(ONE_BI)

      // Update the pool with the new active liquidity, price, and tick.
      pool.liquidity = event.params.liquidity
      pool.tick = BigInt.fromI32(event.params.tick)
      pool.sqrtPrice = event.params.sqrtPriceX96
      if (pool.balanceOfBlock < event.block.number) {
        pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
        pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
      }

      token0.volume = token0.volume.plus(amount0Abs)
      token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
      token0.volumeUSD = token0.volumeUSD.plus(amountTotalUSDTracked)
      token0.untrackedVolumeUSD = token0.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
      token0.feesUSD = token0.feesUSD.plus(feesUSD)
      token0.txCount = token0.txCount.plus(ONE_BI)

      // update token1 data
      token1.volume = token1.volume.plus(amount1Abs)
      token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
      token1.volumeUSD = token1.volumeUSD.plus(amountTotalUSDTracked)
      token1.untrackedVolumeUSD = token1.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
      token1.feesUSD = token1.feesUSD.plus(feesUSD)
      token1.txCount = token1.txCount.plus(ONE_BI)

      // updated pool ratess
      const prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice, token0 as Token, token1 as Token)
      pool.token0Price = prices[0]
      pool.token1Price = prices[1]
      pool.save()

      // update USD pricing
      bundle.ethPriceUSD = getEthPriceInUSD()
      bundle.save()
      token0.derivedETH = findEthPerToken(token0 as Token)
      token1.derivedETH = findEthPerToken(token1 as Token)

      /**
       * Things afffected by new USD rates
       */
      if (pool.balanceOfBlock < event.block.number) {
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

        // KENT TODO: MOVE LOWER - AFTER CHECKING IF POOL APPROVED
        factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
        factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)
      }

      token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH).times(bundle.ethPriceUSD)
      token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH).times(bundle.ethPriceUSD)

      // update fee growth - Removed on token version
      // let poolContract = PoolABI.bind(event.address)
      // let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128()
      // let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128()
      // pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt
      // pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt

      // interval data
      const token0DayData = updateTokenDayData(token0 as Token, event)
      const token1DayData = updateTokenDayData(token1 as Token, event)
      const token0HourData = updateTokenHourData(token0 as Token, event)
      const token1HourData = updateTokenHourData(token1 as Token, event)
      const token0MinuteData = updateTokenMinuteData(token0 as Token, event)
      const token1MinuteData = updateTokenMinuteData(token1 as Token, event)

      // update volume metrics
      // TODO: MOVE TO HELPER FUNCTIONS
      token0DayData.volume = token0DayData.volume.plus(amount0Abs)
      token0DayData.volumeUSD = token0DayData.volumeUSD.plus(amountTotalUSDTracked)
      token0DayData.untrackedVolumeUSD = token0DayData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
      token0DayData.feesUSD = token0DayData.feesUSD.plus(feesUSD)

      token0HourData.volume = token0HourData.volume.plus(amount0Abs)
      token0HourData.volumeUSD = token0HourData.volumeUSD.plus(amountTotalUSDTracked)
      token0HourData.untrackedVolumeUSD = token0HourData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
      token0HourData.feesUSD = token0HourData.feesUSD.plus(feesUSD)

      token0MinuteData.volume = token0MinuteData.volume.plus(amount0Abs)
      token0MinuteData.volumeUSD = token0MinuteData.volumeUSD.plus(amountTotalUSDTracked)
      token0MinuteData.untrackedVolumeUSD = token0MinuteData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
      token0MinuteData.feesUSD = token0MinuteData.feesUSD.plus(feesUSD)

      token1DayData.volume = token1DayData.volume.plus(amount1Abs)
      token1DayData.volumeUSD = token1DayData.volumeUSD.plus(amountTotalUSDTracked)
      token1DayData.untrackedVolumeUSD = token1DayData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
      token1DayData.feesUSD = token1DayData.feesUSD.plus(feesUSD)

      token1HourData.volume = token1HourData.volume.plus(amount1Abs)
      token1HourData.volumeUSD = token1HourData.volumeUSD.plus(amountTotalUSDTracked)
      token1HourData.untrackedVolumeUSD = token1HourData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
      token1HourData.feesUSD = token1HourData.feesUSD.plus(feesUSD)

      token1MinuteData.volume = token1MinuteData.volume.plus(amount1Abs)
      token1MinuteData.volumeUSD = token1MinuteData.volumeUSD.plus(amountTotalUSDTracked)
      token1MinuteData.untrackedVolumeUSD = token1MinuteData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
      token1MinuteData.feesUSD = token1MinuteData.feesUSD.plus(feesUSD)

      token0DayData.save()
      token1DayData.save()
      token0HourData.save()
      token1HourData.save()
      token0MinuteData.save()
      token1MinuteData.save()
      factory.save()
      pool.save()
      token0.save()
      token1.save()
    }
  }
}
