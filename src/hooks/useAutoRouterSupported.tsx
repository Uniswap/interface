import { SupportedChainId } from 'constants/chains'

import { useActiveWeb3React } from './web3'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useActiveWeb3React()
  return chainId === SupportedChainId.MAINNET
}
