import { useIsSupportedChainId } from 'constants/chains'
import { useChainId } from 'wagmi'

export default function useAutoRouterSupported(): boolean {
  const chainId = useChainId()
  return useIsSupportedChainId(chainId)
}
