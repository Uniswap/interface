import { ChainId } from '@swapr/sdk'
import { NETWORK_DETAIL } from '../constants'

export type ChainIdPair = {
  l1ChainId: ChainId | undefined
  l2ChainId: ChainId | undefined
  chainId: ChainId | undefined
}

export const getChainPair = (chainId?: ChainId): ChainIdPair => {
  if (!chainId) {
    return {
      l1ChainId: chainId,
      l2ChainId: undefined,
      chainId
    }
  }

  const networkDetails = NETWORK_DETAIL[chainId]
  const l1 = !networkDetails.isArbitrum ? networkDetails.chainId : networkDetails.partnerChainId
  const l2 = networkDetails.isArbitrum ? networkDetails.chainId : networkDetails.partnerChainId

  if (l1 && l2) {
    return {
      l1ChainId: Number(l1) as ChainId,
      l2ChainId: Number(l2) as ChainId,
      chainId
    }
  }

  return {
    l1ChainId: chainId,
    l2ChainId: undefined,
    chainId
  }
}
