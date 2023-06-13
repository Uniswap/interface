import { useWeb3React } from '@web3-react/core'
import { isSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useWeb3React()
  return isSupportedChainId(chainId)
}
