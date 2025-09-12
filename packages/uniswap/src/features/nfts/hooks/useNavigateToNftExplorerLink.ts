import { NavigateToNftItemArgs } from 'uniswap/src/contexts/UniswapContext'
import { getNftExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'

export function useNavigateToNftExplorerLink(): (args: NavigateToNftItemArgs) => void {
  return useEvent((args: NavigateToNftItemArgs): Promise<void> => openUri({ uri: getNftExplorerLink(args) }))
}
