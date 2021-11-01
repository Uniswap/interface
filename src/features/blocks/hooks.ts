import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'

export function useLatestBlock(chainId: ChainId): number {
  const block = useAppSelector((state) => state.blocks.byChainId[chainId])
  return block?.latestBlockNumber || 0
}
