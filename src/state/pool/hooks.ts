import { useQuery } from '@apollo/client'

import { POOLS_DATA_QUERY, USER_LIQUIDITY_POSITION_SNAPSHOTS } from 'apollo/queries'
import { Token } from 'libs/sdk/src'

/**
 * Get pools data from Subgraph
 *
 * @param tokenA Token | undefined
 * @param tokenB Token | undefined
 */
export function useSubgraphPoolsData(tokenA: Token | undefined, tokenB: Token | undefined) {
  const poolTokenAddresses = [tokenA?.address.toLowerCase(), tokenB?.address.toLowerCase()]

  const { loading, error, data } = useQuery(POOLS_DATA_QUERY, {
    variables: {
      poolTokenAddresses
    }
  })

  return { loading, error, data }
}

/**
 * Get my liquidity for all pools
 *
 * @param account string
 */
export function useUserLiquidityPositions(account: string | null | undefined) {
  const { loading, error, data } = useQuery(USER_LIQUIDITY_POSITION_SNAPSHOTS, {
    variables: {
      account: account?.toLowerCase()
    }
  })

  return { loading, error, data }
}
