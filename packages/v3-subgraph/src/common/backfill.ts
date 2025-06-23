import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import { ERC20 } from '../../generated/Factory/ERC20'
import { Pool as PoolABI } from '../../generated/Factory/Pool'
import { Pool, Token } from '../../generated/schema'
import { Pool as PoolTemplate } from '../../generated/templates'
import { ZERO_BD, ZERO_BI } from './constants'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from './token'
import { convertTokenToDecimal } from './utils'

function populateToken(tokenAddress: Address): void {
  let token = Token.load(tokenAddress)
  if (token != null) {
    return
  }
  token = new Token(tokenAddress)
  token.symbol = fetchTokenSymbol(tokenAddress)
  token.name = fetchTokenName(tokenAddress)
  token.totalSupply = fetchTokenTotalSupply(tokenAddress)
  const decimals = fetchTokenDecimals(tokenAddress)
  if (decimals === null) {
    return
  }
  token.decimals = decimals
  token.derivedETH = ZERO_BD
  token.volume = ZERO_BD
  token.volumeUSD = ZERO_BD
  token.feesUSD = ZERO_BD
  token.untrackedVolumeUSD = ZERO_BD
  token.totalValueLocked = ZERO_BD
  token.totalValueLockedUSD = ZERO_BD
  token.totalValueLockedUSDUntracked = ZERO_BD
  token.txCount = ZERO_BI
  token.poolCount = ZERO_BI
  token.whitelistPools = []
  token.save()
}

/**
 * Create entries in store for hard-coded pools and tokens. This is only
 * used for generating optimism pre-regenesis data.
 */
export function populateEmptyPools(
  event: ethereum.Event,
  poolMappings: Array<Address[]>,
  whitelistTokens: string[]
): void {
  const length = poolMappings.length
  for (let i = 0; i < length; ++i) {
    const poolMapping = poolMappings[i]
    const newAddress = poolMapping[1]
    const token0Address = poolMapping[2]
    const token1Address = poolMapping[3]

    const poolContract = PoolABI.bind(newAddress)
    const pool = new Pool(newAddress) as Pool
    pool.createdAtBlockNumber = event.block.number
    pool.createdAtTimestamp = event.block.timestamp
    pool.token0 = token0Address
    pool.token1 = token1Address
    pool.liquidity = poolContract.liquidity()
    pool.sqrtPrice = ZERO_BI
    pool.token0Price = ZERO_BD
    pool.token1Price = ZERO_BD
    pool.observationIndex = ZERO_BI
    pool.liquidityProviderCount = ZERO_BI
    pool.txCount = ZERO_BI
    pool.totalValueLockedToken0 = ZERO_BD
    pool.totalValueLockedToken1 = ZERO_BD
    pool.totalValueLockedETH = ZERO_BD
    pool.totalValueLockedUSD = ZERO_BD
    pool.totalValueLockedUSDUntracked = ZERO_BD
    pool.volumeToken0 = ZERO_BD
    pool.volumeToken1 = ZERO_BD
    pool.volumeUSD = ZERO_BD
    pool.untrackedVolumeUSD = ZERO_BD
    pool.feesUSD = ZERO_BD
    pool.collectedFeesToken0 = ZERO_BD
    pool.collectedFeesToken1 = ZERO_BD
    pool.collectedFeesUSD = ZERO_BD

    // need fee tier
    const feeTier = poolContract.fee()
    pool.feeTier = BigInt.fromI32(feeTier)

    // create token entities if needed
    populateToken(token0Address)
    populateToken(token1Address)
    const token0 = Token.load(token0Address)
    const token1 = Token.load(token1Address)

    if (token0 && token1) {
      if (whitelistTokens.includes(pool.token0.toHexString())) {
        const newPools = token1.whitelistPools
        newPools.push(pool.id)
        token1.whitelistPools = newPools
      }

      if (whitelistTokens.includes(token1.id.toHexString())) {
        const newPools = token0.whitelistPools
        newPools.push(pool.id)
        token0.whitelistPools = newPools
      }

      // populate the TVL by call contract balanceOf
      const token0Contract = ERC20.bind(Address.fromBytes(pool.token0))
      const tvlToken0Raw = token0Contract.balanceOf(Address.fromBytes(pool.id))
      const tvlToken0Adjusted = convertTokenToDecimal(tvlToken0Raw, token0.decimals)
      pool.totalValueLockedToken0 = tvlToken0Adjusted
      token0.totalValueLocked = tvlToken0Adjusted

      const token1Contract = ERC20.bind(Address.fromBytes(pool.token1))
      const tvlToken1Raw = token1Contract.balanceOf(Address.fromBytes(pool.id))
      const tvlToken1Adjusted = convertTokenToDecimal(tvlToken1Raw, token1.decimals)
      pool.totalValueLockedToken1 = tvlToken1Adjusted
      token1.totalValueLocked = tvlToken1Adjusted

      // add pool to tracked address and store entities
      PoolTemplate.create(Address.fromBytes(pool.id))
      token0.save()
      token1.save()
      pool.save()
    }
  }
}
