import { useQueries } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { wagmiConfig } from '~/components/Web3Provider/wagmiConfig'

/**
 * Fetches current block numbers for specified chains.
 * Returns a Map of chainId -> current block number.
 *
 * @param chainIds - Set of chain IDs to fetch block numbers for
 */
export function useMultiChainBlockNumbers(chainIds: Set<EVMUniverseChainId>): Map<number, bigint> {
  const chainIdsArray = useMemo(() => Array.from(chainIds), [chainIds])

  const results = useQueries({
    queries: chainIdsArray.map((chainId) => ({
      queryKey: [ReactQueryCacheKey.BlockNumber, chainId] as const,
      queryFn: async () => {
        const client = getPublicClient(wagmiConfig, { chainId })
        if (!client) {
          throw new Error(`No public client for chainId ${chainId}`)
        }
        return client.getBlockNumber()
      },
    })),
  })

  return useMemo(() => {
    const map = new Map<number, bigint>()
    chainIdsArray.forEach((chainId, index) => {
      const result = results[index]
      if (result.data !== undefined) {
        map.set(chainId, result.data)
      }
    })
    return map
  }, [chainIdsArray, results])
}
