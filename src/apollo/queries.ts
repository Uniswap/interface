import { gql } from '@apollo/client'

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
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    feeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
  }
`

export const POOLS_DATA_QUERY = gql`
  query pools($poolTokenAddresses: [String!]!) {
    pools(where: { token0_in: $poolTokenAddresses, token1_in: $poolTokenAddresses }) {
      ...PoolFields
    }
  }
  ${PoolFields}
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
