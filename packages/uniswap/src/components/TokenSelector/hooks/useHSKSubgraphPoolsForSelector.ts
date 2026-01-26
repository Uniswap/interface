import { useQuery } from '@tanstack/react-query'
import { getHSKSubgraphUrl } from 'uniswap/src/constants/subgraphUrl'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

// 使用统一的 subgraph URL 获取函数，支持环境变量和内网访问
const SUBGRAPH_URL = getHSKSubgraphUrl()

interface SubgraphPool {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  feeTier: string
  liquidity: string
  totalValueLockedUSD: string
}

interface SubgraphResponse {
  pools: SubgraphPool[]
}

interface PoolForSelector {
  token0: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  token1: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
}

async function querySubgraph(query: string, variables: Record<string, unknown> = {}) {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`)
    }

    return data.data as SubgraphResponse
  } catch (error) {
    throw error
  }
}

const TOP_POOLS_QUERY = `
  query TopPools($first: Int!) {
    pools(
      first: $first
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
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
      feeTier
      liquidity
      totalValueLockedUSD
    }
  }
`

function convertSubgraphPoolToPoolForSelector(pool: SubgraphPool): PoolForSelector {
  return {
    token0: {
      address: pool.token0.id,
      symbol: pool.token0.symbol,
      name: pool.token0.name,
      decimals: parseInt(pool.token0.decimals, 10),
    },
    token1: {
      address: pool.token1.id,
      symbol: pool.token1.symbol,
      name: pool.token1.name,
      decimals: parseInt(pool.token1.decimals, 10),
    },
  }
}

/**
 * Hook to fetch pools from HSK Subgraph for Token Selector
 * Returns pools data in a format suitable for extracting tokens
 */
export function useHSKSubgraphPoolsForSelector(first: number = 1000) {
  return useQuery({
    queryKey: ['hsk-subgraph-pools-selector', first],
    queryFn: async () => {
      const data = await querySubgraph(TOP_POOLS_QUERY, { first })
      const pools = data.pools.map(convertSubgraphPoolToPoolForSelector)
      return pools
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2, // Retry 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}
