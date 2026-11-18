import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { EVMUniverseChainId } from '@universe/chains'
import { getPublicClient } from '@wagmi/core'
import { useCallback } from 'react'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { Block } from '~/chains'
import { wagmiConfig } from '~/connection/wagmiConfig'

/**
 * A chain whose RPC failed is in neither `blocksByChain` nor `pendingChainIds`, so callers hold rows
 * back only while a block is on its way, not for as long as the RPC is down.
 */
export function useMultiChainBlockInfo(chainIds: Set<EVMUniverseChainId>): {
  blocksByChain: Map<number, Block>
  pendingChainIds: Set<number>
} {
  const combine = useCallback(
    (results: UseQueryResult<Block>[]) => {
      const blocksByChain = new Map<number, Block>()
      const pendingChainIds = new Set<number>()
      Array.from(chainIds).forEach((chainId, index) => {
        const result = results[index]
        if (result.data !== undefined) {
          blocksByChain.set(chainId, result.data)
        } else if (result.isPending) {
          pendingChainIds.add(chainId)
        }
      })
      return { blocksByChain, pendingChainIds }
    },
    [chainIds],
  )

  return useQueries({
    queries: Array.from(chainIds).map((chainId) => ({
      queryKey: [ReactQueryCacheKey.BlockInfo, chainId] as const,
      queryFn: async (): Promise<Block> => {
        const client = getPublicClient(wagmiConfig, { chainId })
        if (!client) {
          throw new Error(`No public client for chainId ${chainId}`)
        }
        return await client.getBlock()
      },
      // Mainnet's block time; a fresher block only moves a countdown by seconds.
      staleTime: 12_000,
      gcTime: 60_000,
    })),
    combine,
  })
}
