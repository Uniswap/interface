import { useWeb3React } from '@web3-react/core'
import { AUTO_ROUTER_SUPPORTED_CHAINS } from 'lib/hooks/routing/clientSideSmartOrderRouter'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useWeb3React()
  return Boolean(chainId && AUTO_ROUTER_SUPPORTED_CHAINS.includes(chainId))
}
