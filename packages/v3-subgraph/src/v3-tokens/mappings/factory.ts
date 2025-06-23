import { BigInt, log } from '@graphprotocol/graph-ts'

import { PoolCreated } from '../../../generated/Factory/Factory'
import { Pool, Token } from '../../../generated/schema'
import { Pool as PoolTemplate } from '../../../generated/templates'
import { WHITELIST_TOKENS } from '../../common/chain'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'
import { getFactory } from '../../common/entityGetters'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from '../../common/token'

export function handlePoolCreated(event: PoolCreated): void {
  // Temp limitation for data testing
  // if (
  //   event.params.pool != Address.fromHexString('0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8') &&
  //   event.params.pool != Address.fromHexString('0x0e2c4be9f3408e5b1ff631576d946eb8c224b5ed') &&
  //   event.params.pool != Address.fromHexString('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640')
  // )
  //   return

  // // temp fix
  // if (event.params.pool != Address.fromHexString('0xbfe6843B931C9c1b7B705195B7Af57B228fa8561')) {
  //   return
  // }

  // load factory
  const factory = getFactory()

  factory.poolCount = factory.poolCount.plus(ONE_BI)

  const pool = new Pool(event.params.pool) as Pool
  let token0 = Token.load(event.params.token0)
  let token1 = Token.load(event.params.token1)

  // fetch info if null
  if (!token0) {
    token0 = new Token(event.params.token0)
    token0.tokenAddress = event.params.token0.toHexString()
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    token0.lastMinuteArchived = BigInt.fromI32(0)
    token0.lastHourArchived = BigInt.fromI32(0)
    token0.lastMinuteRecorded = BigInt.fromI32(0)
    token0.lastHourRecorded = BigInt.fromI32(0)
    const decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (!decimals) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedETH = ZERO_BD
    token0.volume = ZERO_BD
    token0.volumeUSD = ZERO_BD
    token0.feesUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalValueLocked = ZERO_BD
    token0.totalValueLockedUSD = ZERO_BD
    token0.totalValueLockedUSDUntracked = ZERO_BD
    token0.txCount = ZERO_BI
    token0.poolCount = ZERO_BI
    token0.whitelistPools = []
    token0.minuteArray = []
    token0.hourArray = []
  }

  if (!token1) {
    token1 = new Token(event.params.token1)
    token1.tokenAddress = event.params.token0.toHexString()
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)
    token1.lastMinuteArchived = BigInt.fromI32(0)
    token1.lastHourArchived = BigInt.fromI32(0)
    token1.lastMinuteRecorded = BigInt.fromI32(0)
    token1.lastHourRecorded = BigInt.fromI32(0)
    const decimals = fetchTokenDecimals(event.params.token1)
    // bail if we couldn't figure out the decimals
    if (!decimals) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.decimals = decimals
    token1.derivedETH = ZERO_BD
    token1.volume = ZERO_BD
    token1.volumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.feesUSD = ZERO_BD
    token1.totalValueLocked = ZERO_BD
    token1.totalValueLockedUSD = ZERO_BD
    token1.totalValueLockedUSDUntracked = ZERO_BD
    token1.txCount = ZERO_BI
    token1.poolCount = ZERO_BI
    token1.whitelistPools = []
    token1.minuteArray = []
    token1.hourArray = []
  }

  // update white listed pools
  if (WHITELIST_TOKENS.includes(token0.id.toHexString())) {
    const newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }
  if (WHITELIST_TOKENS.includes(token1.id.toHexString())) {
    const newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.liquidityProviderCount = ZERO_BI
  pool.txCount = ZERO_BI
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.feeGrowthGlobal0X128 = ZERO_BI
  pool.feeGrowthGlobal1X128 = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.observationIndex = ZERO_BI
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.totalValueLockedETH = ZERO_BD
  pool.totalValueLockedUSDUntracked = ZERO_BD
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.untrackedVolumeUSD = ZERO_BD
  pool.balanceOfBlock = ZERO_BI

  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD

  pool.save()
  token0.save()
  token1.save()
  factory.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
}
