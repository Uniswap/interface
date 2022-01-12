import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { AUTO_ROUTER_SUPPORTED_CHAINS } from 'state/routing/clientSideSmartOrderRouter/constants'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useActiveWeb3React()
  return Boolean(chainId && AUTO_ROUTER_SUPPORTED_CHAINS.includes(chainId))
}
