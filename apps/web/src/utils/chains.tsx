import { CHAIN_INFO, NetworkLayer, SupportedInterfaceChainId, SupportedL2ChainId } from 'constants/chains'

export function isL2ChainId(chainId: SupportedInterfaceChainId): chainId is SupportedL2ChainId {
  const chainInfo = CHAIN_INFO[chainId]
  return chainInfo.networkLayer === NetworkLayer.L2
}
