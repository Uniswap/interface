import { useWeb3React } from '@web3-react/core'
import { SUPPORTED_V2POOL_CHAIN_IDS } from 'constants/chains'

export function useNetworkSupportsV2() {
  const { chainId } = useWeb3React()
  return chainId && SUPPORTED_V2POOL_CHAIN_IDS.includes(chainId)
}
