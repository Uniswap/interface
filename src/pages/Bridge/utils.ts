import { ChainId } from '@swapr/sdk'
import { getNetworkInfo } from '../../utils/networksList'

export enum BridgeStep {
  Initial,
  Collect,
  Success,
  Transfer
}

export const isNetworkDisabled = (optionChainId: ChainId, selectedNetworkChainId: ChainId) => {
  return (
    selectedNetworkChainId === optionChainId ||
    getNetworkInfo(optionChainId).tag === 'coming soon' ||
    !getNetworkInfo(optionChainId).partnerChainId
  )
}
