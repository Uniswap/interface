import { useCallback } from 'react'
import { NavigateToNftItemArgs } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

export function useNavigateToNftExplorerLink(): (args: NavigateToNftItemArgs) => void {
  const { defaultChainId } = useEnabledChains()
  return useCallback(
    ({ address, tokenId, chainId }: NavigateToNftItemArgs): void => {
      window.open(
        getExplorerLink({
          chainId: chainId ?? defaultChainId,
          data: `${address}/${tokenId}`,
          type: ExplorerDataType.NFT,
        }),
        '_blank',
      )
    },
    [defaultChainId],
  )
}
