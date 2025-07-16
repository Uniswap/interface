import { Address, Bytes } from '@graphprotocol/graph-ts'

import { Bundle, Factory, Pool, Token } from '../../generated/schema'
import { FACTORY_ADDRESS } from './chain'
import { ADDRESS_ZERO, ZERO_BD, ZERO_BI } from './constants'

export function getBundle(): Bundle {
  let bundle = Bundle.load('1')

  if (!bundle) {
    bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()
  }

  return bundle
}

export function getFactory(): Factory {
  let factory = Factory.load(Address.fromString(FACTORY_ADDRESS))
  if (!factory) {
    factory = new Factory(Address.fromString(FACTORY_ADDRESS))
    factory.poolCount = ZERO_BI
    factory.totalVolumeETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesETH = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.totalValueLockedETHUntracked = ZERO_BD
    factory.txCount = ZERO_BI
    factory.owner = ADDRESS_ZERO

    getBundle()
  }

  return factory
}

// Function should only be called from core when pools are gaurenteed (they are created in factory)
export function getPool(address: Bytes): Pool {
  const pool = Pool.load(address)!

  return pool
}

// Function should only be called from core when tokens are gaurenteed (they are created in factory)
export function getToken(address: Bytes): Token {
  const token = Token.load(address)!

  return token
}
