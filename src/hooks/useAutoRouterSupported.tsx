import { SUPPORTED_CHAINS } from 'state/routing/clientSideSmartOrderRouter/constants'

import { useActiveWeb3React } from './web3'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useActiveWeb3React()
  return Boolean(chainId && SUPPORTED_CHAINS.includes(chainId))
}
