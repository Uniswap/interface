import { gql } from '@apollo/client'

import { ChainId } from '@dynamic-amm/sdk'
import { BUNDLE_ID, FACTORY_ADDRESSES } from '../constants'

export const SUBGRAPH_BLOCK_NUMBER = () => gql`
  query block_number {
    _meta {
      block {
        number
      }
    }
  }
`

export const ETH_PRICE = (block?: number) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id: ${BUNDLE_ID} } block: {number: ${block}}) {
        id
        ethPrice
      }
    }
  `
    : ` query bundles {
      bundles(where: { id: ${BUNDLE_ID} }) {
        id
        ethPrice
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_DERIVED_ETH = (tokenAddress: string) => {
  const queryString = `
    query tokens {
      tokens(where: { id: "${tokenAddress.toLowerCase()}"} ) {
        derivedETH
      }
    }
    `

  return gql(queryString)
}

export const GLOBAL_DATA = (chainId: ChainId, block?: number) => {
  const queryString = `query dmmFactories {
    dmmFactories(
       ${block ? `block: { number: ${block}}` : ``} 
       where: { id: "${FACTORY_ADDRESSES[chainId as ChainId].toLowerCase()}" }) {
        id
        totalVolumeUSD
        totalFeeUSD
        totalVolumeETH
        untrackedVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
        totalAmplifiedLiquidityUSD
        totalAmplifiedLiquidityETH
        txCount
        pairCount
      }
    }`

  return gql(queryString)
}

export const GET_BLOCK = gql`
  query blocks($timestampFrom: Int!, $timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
    ) {
      id
      number
      timestamp
    }
  }
`

export const GET_BLOCKS = (timestamps: number[]) => {
  let queryString = 'query blocks {'
  queryString += timestamps.map(timestamp => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp +
      600} }) {
      number
    }`
  })
  queryString += '}'
  return gql(queryString)
}

const PoolFields = `
  fragment PoolFields on Pool {
    id
    txCount
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    amp
    reserve0
    reserve1
    vReserve0
    vReserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    feeUSD
    untrackedVolumeUSD
    untrackedFeeUSD
    token0Price
    token1Price
    token0PriceMin
    token0PriceMax
    token1PriceMin
    token1PriceMax
    createdAtTimestamp
  }
`

export const USER_POSITIONS = gql`
  query liquidityPositions($user: Bytes!) {
    liquidityPositions(where: { user: $user }) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
          symbol
          derivedETH
        }
        totalSupply
      }
      pool {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
          symbol
          derivedETH
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`

export const USER_LIQUIDITY_POSITION_SNAPSHOTS = gql`
  query liquidityPositionSnapshots($account: String!) {
    liquidityPositionSnapshots(where: { user: $account }) {
      pool {
        id
      }
      liquidityTokenBalance
      liquidityTokenTotalSupply
      reserveUSD
      timestamp
    }
  }
`

export const POOL_DATA = (poolAddress: string, block: number) => {
  const queryString = `
    query pools {
      pools(${block ? `block: {number: ${block}}` : ``} where: { id: "${poolAddress}"} ) {
        ...PoolFields
      }
    }
    ${PoolFields}
    `

  return gql(queryString)
}

export const POOLS_BULK = gql`
  ${PoolFields}
  query pools($allPools: [Bytes]!) {
    pools(where: { id_in: $allPools }, orderBy: trackedReserveETH, orderDirection: desc) {
      ...PoolFields
    }
  }
`

export const POOLS_HISTORICAL_BULK = (block: number, pools: string[]) => {
  // Construct the poolsString
  let poolsString = `[`
  pools.map((pool: string) => {
    return (poolsString += `"${pool}"`)
  })
  poolsString += ']'

  const queryString = `
  query pools {
    pools(first: 200, where: {id_in: ${poolsString}}, block: {number: ${block}}, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      feeUSD
      untrackedVolumeUSD
      untrackedFeeUSD
    }
  }
  `

  return gql(queryString)
}

export const FARM_DATA = gql`
  query farmData($poolsList: [Bytes]!) {
    pools(where: { id_in: $poolsList }) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      amp
      reserveUSD
      totalSupply
    }
  }
`

export const FARM_HISTORIES = gql`
  query farmHistories($user: String!) {
    deposits(where: { user: $user }) {
      id
      timestamp
      poolID
      stakeToken
      amount
    }
    withdraws(where: { user: $user }) {
      id
      timestamp
      poolID
      stakeToken
      amount
    }
    harvests(where: { user: $user }) {
      id
      timestamp
      poolID
      rewardToken
      stakeToken
      amount
    }
    vests(where: { user: $user }) {
      id
      timestamp
      rewardToken
      amount
    }
  }
`
