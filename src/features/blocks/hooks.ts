import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId, ChainIdTo } from 'src/constants/chains'

export function useLatestBlock(chainId: ChainId): number {
  const block = useAppSelector((state) => state.blocks.byChainId[chainId])
  return block?.latestBlockNumber || 0
}

export function useLatestBlockChainMap(chainIds: ChainId[]): ChainIdTo<number> {
  const byChainId = useAppSelector((state) => state.blocks.byChainId)
  return useMemo(
    () =>
      chainIds.reduce<ChainIdTo<number>>((result, chainId) => {
        result[chainId] = byChainId[chainId]?.latestBlockNumber || 0
        return result
      }, {}),
    [chainIds, byChainId]
  )
}
