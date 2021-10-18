import { useAppSelector } from 'src/app/hooks'
import { SupportedChainId } from 'src/constants/chains'

export function useLatestBlock(chainId: SupportedChainId): number {
  const block = useAppSelector((state) => state.blocks.byChainId[chainId])
  return block?.latestBlockNumber || 0
}
