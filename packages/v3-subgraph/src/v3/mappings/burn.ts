import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Burn, Factory, Pool, Tick, Token } from '../../../generated/schema'
import { Burn as BurnEvent } from '../../../generated/templates/Pool/Pool'
import { FACTORY_ADDRESS } from '../../common/chain'
import { ONE_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData,
} from './intervalUpdates'
import { loadTransaction } from './utils'

export function handleBurn(event: BurnEvent): void {
  const factoryAddress = FACTORY_ADDRESS

  const bundle = Bundle.load('1')!
  const pool = Pool.load(event.address)!
  const factory = Factory.load(factoryAddress.toHexString())!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

    const amountUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)))

    // update globals
    factory.txCount = factory.txCount.plus(ONE_BI)

    // update token0 data
    token0.txCount = token0.txCount.plus(ONE_BI)

    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI)

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI)
    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on burn if the position being burnt includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      // todo: this liquidity can be calculated from the real reserves and
      // current price instead of incrementally from every burned amount which
      // may not be accurate: https://linear.app/uniswap/issue/DAT-336/fix-pool-liquidity
      pool.liquidity = pool.liquidity.minus(event.params.amount)
    }

    // burn entity
    const transaction = loadTransaction(event)
    const burn = new Burn(transaction.id + '-' + event.logIndex.toString())
    burn.transaction = transaction.id
    burn.timestamp = transaction.timestamp
    burn.pool = pool.id
    burn.token0 = pool.token0
    burn.token1 = pool.token1
    burn.owner = event.params.owner
    burn.origin = event.transaction.from
    burn.amount = event.params.amount
    burn.amount0 = amount0
    burn.amount1 = amount1
    burn.amountUSD = amountUSD
    burn.tickLower = BigInt.fromI32(event.params.tickLower)
    burn.tickUpper = BigInt.fromI32(event.params.tickUpper)
    burn.logIndex = event.logIndex

    // tick entities
    const lowerTickId = pool.id.toHexString() + '#' + BigInt.fromI32(event.params.tickLower).toString()
    const upperTickId = pool.id.toHexString() + '#' + BigInt.fromI32(event.params.tickUpper).toString()
    const lowerTick = Tick.load(lowerTickId)
    const upperTick = Tick.load(upperTickId)
    if (lowerTick && upperTick) {
      const amount = event.params.amount
      lowerTick.liquidityGross = lowerTick.liquidityGross.minus(amount)
      lowerTick.liquidityNet = lowerTick.liquidityNet.minus(amount)
      upperTick.liquidityGross = upperTick.liquidityGross.minus(amount)
      upperTick.liquidityNet = upperTick.liquidityNet.plus(amount)

      lowerTick.save()
      upperTick.save()
    }
    updateUniswapDayData(event, factoryAddress.toHexString())
    updatePoolDayData(event)
    updatePoolHourData(event)
    updateTokenDayData(token0 as Token, event)
    updateTokenDayData(token1 as Token, event)
    updateTokenHourData(token0 as Token, event)
    updateTokenHourData(token1 as Token, event)

    token0.save()
    token1.save()
    pool.save()
    factory.save()
    burn.save()
  }
}
