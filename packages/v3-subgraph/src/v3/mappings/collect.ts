import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Collect, Factory, Pool, Token } from '../../../generated/schema'
import { Collect as CollectEvent } from '../../../generated/templates/Pool/Pool'
import { FACTORY_ADDRESS } from '../../common/chain'
import { ONE_BI } from '../../common/constants'
import { getTrackedAmountUSD } from '../../common/pricing'
import { convertTokenToDecimal } from '../../common/utils'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData,
} from './intervalUpdates'
import { loadTransaction } from './utils'

export function handleCollect(event: CollectEvent): void {
  const factoryAddress = FACTORY_ADDRESS

  const bundle = Bundle.load('1')!
  const pool = Pool.load(event.address)!
  if (pool == null) {
    return
  }
  const transaction = loadTransaction(event)
  const factory = Factory.load(factoryAddress.toHexString())!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)
  if (token0 == null || token1 == null) {
    return
  }

  // Get formatted amounts collected.
  const collectedAmountToken0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  const collectedAmountToken1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  const trackedCollectedAmountUSD = getTrackedAmountUSD(
    collectedAmountToken0,
    token0 as Token,
    collectedAmountToken1,
    token1 as Token
  )

  // Reset tvl aggregates until new amounts calculated
  factory.totalValueLockedETH = factory.totalValueLockedETH.minus(pool.totalValueLockedETH)

  // Update globals
  factory.txCount = factory.txCount.plus(ONE_BI)

  // update token data
  token0.txCount = token0.txCount.plus(ONE_BI)
  token0.totalValueLocked = token0.totalValueLocked.minus(collectedAmountToken0)
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

  token1.txCount = token1.txCount.plus(ONE_BI)
  token1.totalValueLocked = token1.totalValueLocked.minus(collectedAmountToken1)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

  // Adjust pool TVL based on amount collected.
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(collectedAmountToken0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(collectedAmountToken1)
  pool.totalValueLockedETH = pool.totalValueLockedToken0
    .times(token0.derivedETH)
    .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
  pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

  // Update aggregate fee collection values.
  pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(collectedAmountToken0)
  pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(collectedAmountToken1)
  pool.collectedFeesUSD = pool.collectedFeesUSD.plus(trackedCollectedAmountUSD)

  // reset aggregates with new amounts
  factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
  factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)

  const collect = new Collect(transaction.id + '-' + event.logIndex.toString())
  collect.transaction = transaction.id
  collect.timestamp = event.block.timestamp
  collect.pool = pool.id
  collect.owner = event.params.owner
  collect.amount0 = collectedAmountToken0
  collect.amount1 = collectedAmountToken1
  collect.amountUSD = trackedCollectedAmountUSD
  collect.tickLower = BigInt.fromI32(event.params.tickLower)
  collect.tickUpper = BigInt.fromI32(event.params.tickUpper)
  collect.logIndex = event.logIndex

  updateUniswapDayData(event, factoryAddress.toHexString())
  updatePoolDayData(event)
  updatePoolHourData(event)
  updateTokenDayData(token0 as Token, event)
  updateTokenDayData(token1 as Token, event)
  updateTokenHourData(token0 as Token, event)
  updateTokenHourData(token1 as Token, event)

  token0.save()
  token1.save()
  factory.save()
  pool.save()
  collect.save()

  return
}
