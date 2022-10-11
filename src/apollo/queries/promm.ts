import { gql } from '@apollo/client'

export const PROMM_POOLS_BULK = (block: number | undefined, pools: string[]) => {
  let poolString = `[`
  pools.map(address => {
    return (poolString += `"${address}",`)
  })
  poolString += ']'
  const queryString =
    `
    query pools {
      pools(where: {id_in: ${poolString}},` +
    (block ? `block: {number: ${block}} ,` : ``) +
    ` orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
        id
        feeTier
        liquidity
        reinvestL
        sqrtPrice
        tick
        token0 {
            id
            symbol
            name
            decimals
            derivedETH
        }
        token1 {
            id
            symbol
            name
            decimals
            derivedETH
        }
        token0Price
        token1Price
        volumeUSD
        txCount
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
      }
    }
  `
  return gql(queryString)
}

export interface ProMMPoolFields {
  id: string
  feeTier: string
  liquidity: string
  sqrtPrice: string
  reinvestL: string
  tick: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token0Price: string
  token1Price: string
  volumeUSD: string
  txCount: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  totalValueLockedUSD: string
}

export interface Tick {
  tickIdx: number
  liquidityNet: string
  price0: string
  price1: string
}

export const ALL_TICKS = (poolAddress: string) => {
  const p = '"' + poolAddress + '"'
  return gql`
    query allV3Ticks {
      ticks(first: 1000,  where: { poolAddress: ${p} }, orderBy: tickIdx) {
        tickIdx
        liquidityNet
        price0
        price1
      }
    }
  `
}

export const POOL_POSITION_COUNT = (poolAddresses: string[]) => {
  const p = JSON.stringify(poolAddresses.map(id => id.toLowerCase()))

  return gql`
    query positionCount {
      pools(first: 1000,  where: { id_in: ${p} }) {
        id
        positionCount
        feeTier
        closedPostionCount
      }
    }
  `
}

export const PROMM_GET_POOL_VALUES_AFTER_MINTS_SUCCESS = gql`
  query getPoolValuesAfterMintsSuccess($poolAddress: String!) {
    pool(id: $poolAddress) {
      id
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
      feeTier
      mints(orderBy: timestamp, orderDirection: desc, first: 20) {
        id
        amount0
        amount1
        amountUSD
      }
    }
  }
`

export const PROMM_GET_POOL_VALUES_AFTER_BURNS_SUCCESS = gql`
  query getPoolValuesAfterBurnsSuccess($poolAddress: String!) {
    pool(id: $poolAddress) {
      id
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
      feeTier
      burns(orderBy: timestamp, orderDirection: desc, first: 20) {
        id
        amount0
        amount1
        amountUSD
      }
    }
  }
`

export const PROMM_GET_MINT_VALUES_AFTER_CREATE_POOL_SUCCESS = gql`
  query getPoolValuesAfterBurnsSuccess($transactionHash: String!) {
    transaction(id: $transactionHash) {
      id
      mints {
        id
        amount0
        amount1
        amountUSD
      }
    }
  }
`
