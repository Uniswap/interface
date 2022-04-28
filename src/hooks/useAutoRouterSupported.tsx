import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { AUTO_ROUTER_SUPPORTED_CHAINS } from 'lib/hooks/routing/clientSideSmartOrderRouter'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useActiveWeb3React()
  return Boolean(chainId && AUTO_ROUTER_SUPPORTED_CHAINS.includes(chainId))
}
