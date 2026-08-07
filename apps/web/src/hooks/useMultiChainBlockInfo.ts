import { useQueries } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { Block } from '~/chains'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { calibratedBlockToTimestamp } from '~/utils/blockToTimestamp'

/**
 * Fetches current block numbers and timestamps for specified chains.
 * Uses a single RPC call per chain for efficiency (getBlock returns both).
 * Returns a Map of chainId -> { blockNumber, timestamp }.
 *
 * @param chainIds - Set of chain IDs to fetch block info for
 * @returns Map of chainId to BlockInfo (blockNumber and timestamp)
 */
export function useMultiChainBlockInfo(chainIds: Set<EVMUniverseChainId>): Map<number, Block> {
  const chainIdsArray = useMemo(() => Array.from(chainIds), [chainIds])

  const results = useQueries({
    queries: chainIdsArray.map((chainId) => ({
      queryKey: [ReactQueryCacheKey.BlockNumber, chainId] as const,
      queryFn: async () => {
        const client = getPublicClient(wagmiConfig, { chainId })
        if (!client) {
          throw new Error(`No public client for chainId ${chainId}`)
        }
        return await client.getBlock()
      },
      // Cache for reasonable duration (blocks are immutable once created)
      staleTime: 12_000, // 12 seconds (Ethereum mainnet block time)
      gcTime: 60_000, // 1 minute
    })),
  })

  return useMemo(() => {
    const map = new Map<number, Block>()
    chainIdsArray.forEach((chainId, index) => {
      const result = results[index]
      if (result.data !== undefined) {
        map.set(chainId, result.data)
      }
    })
    return map
  }, [chainIdsArray, results])
}

/**
 * Creates a consistent key for a (chainId, blockNumber) pair.
 * Format: `${chainId}-${blockNumber}`
 */
function makeBlockTimestampKey(chainId: EVMUniverseChainId, blockNumber: string): string {
  return `${chainId}-${blockNumber}`
}

export interface BlockTimestampRequest {
  chainId: EVMUniverseChainId
  blockNumber: string
}

/**
 * Fetches block timestamps for multiple (chainId, blockNumber) pairs.
 * Automatically deduplicates requests and uses React Query caching.
 *
 * For past blocks: fetches actual timestamps via RPC
 * For future blocks: estimates timestamps using average block time
 *
 * @param requests - Array of block timestamp requests (must be a stable/memoized reference)
 * @param blocksByChain - Map of chainId -> BlockInfo, used to determine past vs future blocks
 * @returns Lookup function to get timestamp for a (chainId, blockNumber) pair
 *
 * @example
 * ```typescript
 * const requests = auctions.flatMap(a => [
 *   { chainId: a.chainId, blockNumber: a.startBlock },
 *   { chainId: a.chainId, blockNumber: a.endBlock }
 * ])
 *
 * const blocksByChain = useMultiChainBlockNumbers(chainIds)
 * const getTimestamp = useGetBlockTimestamps(requests, blocksByChain)
 * const startTime = getTimestamp(chainId, startBlock)
 * ```
 */
export function useGetBlockTimestamps(
  requests: BlockTimestampRequest[],
  blocksByChain: Map<number, Block>,
): (chainId: EVMUniverseChainId, blockNumber: string) => bigint | undefined {
  // Separate requests into past blocks (need RPC fetch) and future blocks (need estimation)
  const { pastBlockRequests, futureBlockRequests } = useMemo(() => {
    const past: BlockTimestampRequest[] = []
    const future: BlockTimestampRequest[] = []
    const seen = new Set<string>()

    for (const request of requests) {
      const key = makeBlockTimestampKey(request.chainId, request.blockNumber)
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      const currentBlock = blocksByChain.get(request.chainId)?.number ?? undefined
      const blockNumber = BigInt(request.blockNumber)

      if (currentBlock !== undefined && blockNumber > currentBlock) {
        future.push(request)
      } else {
        past.push(request)
      }
    }

    return { pastBlockRequests: past, futureBlockRequests: future }
  }, [requests, blocksByChain])

  // Fetch timestamps for past blocks in parallel using React Query
  const pastBlockResults = useQueries({
    queries: pastBlockRequests.map((request) => ({
      queryKey: [ReactQueryCacheKey.BlockTimestamp, request.chainId, request.blockNumber] as const,
      queryFn: async () => {
        const client = getPublicClient(wagmiConfig, { chainId: request.chainId })
        if (!client) {
          throw new Error(`No public client for chainId ${request.chainId}`)
        }

        const block = await client.getBlock({
          blockNumber: BigInt(request.blockNumber),
        })

        return block.timestamp
      },
      // Block timestamps are immutable - cache for 1 hour
      staleTime: 60 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  })

  return useMemo(() => {
    const timestampMap = new Map<string, bigint>()

    // Earliest fetched past block per chain — longest baseline to the live block, so the
    // calibrated rate averages over the auction window rather than a few noisy blocks.
    const pastAnchorByChain = new Map<EVMUniverseChainId, { block: number; timestampMs: number }>()

    // Add past block timestamps from RPC
    pastBlockRequests.forEach((request, index) => {
      const result = pastBlockResults[index]
      if (result.data !== undefined) {
        const key = makeBlockTimestampKey(request.chainId, request.blockNumber)
        timestampMap.set(key, result.data)

        const block = Number(request.blockNumber)
        const anchor = pastAnchorByChain.get(request.chainId)
        if (!anchor || block < anchor.block) {
          pastAnchorByChain.set(request.chainId, { block, timestampMs: Number(result.data) * 1000 })
        }
      }
    })

    // Estimate future block timestamps, calibrating the block rate against a real past
    // block when one is available. On demand-driven-block chains (e.g. Arbitrum Orbit)
    // the chain-constant blockTimeMs can be off several-fold, which inflated/deflated
    // every start/end countdown derived from these estimates.
    futureBlockRequests.forEach((request) => {
      const currentBlockData = blocksByChain.get(request.chainId)
      if (!currentBlockData || !currentBlockData.number) {
        return
      }

      const currentBlock = Number(currentBlockData.number)
      const currentTimeMs = Number(currentBlockData.timestamp) * 1000
      const anchor = pastAnchorByChain.get(request.chainId)

      // No past anchor → calibratedBlockToTimestamp falls back to the chain-constant rate
      // extrapolated from the live block (previous behavior).
      const estimated = calibratedBlockToTimestamp({
        block: Number(request.blockNumber),
        anchorBlock: anchor?.block ?? currentBlock,
        anchorTime: new Date(anchor?.timestampMs ?? currentTimeMs),
        chainId: request.chainId,
        currentBlock,
        currentTime: new Date(currentTimeMs),
      })

      const key = makeBlockTimestampKey(request.chainId, request.blockNumber)
      timestampMap.set(key, BigInt(Math.floor(estimated.getTime() / 1000)))
    })

    return (chainId: EVMUniverseChainId, blockNumber: string): bigint | undefined => {
      const key = makeBlockTimestampKey(chainId, blockNumber)
      return timestampMap.get(key)
    }
  }, [pastBlockRequests, pastBlockResults, futureBlockRequests, blocksByChain])
}
