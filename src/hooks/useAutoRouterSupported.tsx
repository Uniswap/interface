import { useWeb3React } from '@web3-react/core'
import { isChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useWeb3React()
  return isChainId(chainId)
}
