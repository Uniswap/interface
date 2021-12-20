import { ChainId } from '@swapr/sdk'
import { getNetworkInfo } from '../../utils/networksList'

export enum BridgeStep {
  Initial,
  Collect,
  Success
}

export const isNetworkDisabled = (optionChainId: ChainId, selectedNetworkChainId: ChainId) => {
  const { tag, partnerChainId } = getNetworkInfo(optionChainId)
  return selectedNetworkChainId === optionChainId || tag === 'coming soon' || !partnerChainId
}
