import { NavigateToNftItemArgs } from 'uniswap/src/contexts/UniswapContext'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'

export function useNavigateToNftExplorerLink(): (args: NavigateToNftItemArgs) => void {
  return useEvent(({ address, tokenId, chainId, fallbackChainId }: NavigateToNftItemArgs): void => {
    const targetChainId = chainId ?? fallbackChainId
    window.open(
      getExplorerLink({
        chainId: targetChainId,
        data: `${address}/${tokenId}`,
        type: ExplorerDataType.NFT,
      }),
      '_blank',
    )
  })
}
