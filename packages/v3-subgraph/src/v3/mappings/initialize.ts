import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Pool, Token } from '../../../generated/schema'
import { Initialize } from '../../../generated/templates/Pool/Pool'
import { findEthPerToken, getEthPriceInUSD } from '../../common/pricing'
import { updatePoolDayData, updatePoolHourData } from './intervalUpdates'

export function handleInitialize(event: Initialize): void {
  // update pool sqrt price and tick
  const pool = Pool.load(event.address)!
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()

  // update token prices
  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  // update ETH price now that prices could have changed
  const bundle = Bundle.load('1')!
  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()

  updatePoolDayData(event)
  updatePoolHourData(event)

  // update token prices
  if (token0 && token1) {
    token0.derivedETH = findEthPerToken(token0 as Token)
    token1.derivedETH = findEthPerToken(token1 as Token)
    token0.save()
    token1.save()
  }
}
