import { ChainId } from '@swapr/sdk'
import { NetworkOptionProps, networkOptionsPreset } from '../../components/NetworkSwitcher'
import { NETWORK_DETAIL } from '../../constants'

export enum BridgeStep {
  Initial,
  Collect,
  Success
}

export const createNetworkOptions = ({
  value,
  setValue,
  activeChainId
}: {
  value: ChainId
  setValue: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
}): Array<NetworkOptionProps & { chainId: ChainId }> => {
  return networkOptionsPreset
    .map(option => {
      const { chainId: optionChainId, logoSrc, name } = option

      return {
        chainId: optionChainId,
        header: name,
        logoSrc: logoSrc,
        active: value === activeChainId,
        disabled: value === optionChainId,
        onClick: () => setValue(optionChainId)
      }
    })
    .filter(option => !!NETWORK_DETAIL[option.chainId]?.partnerChainId)
}

export const getNetworkOptionById = (chainId: ChainId, options: ReturnType<typeof createNetworkOptions>) =>
  options.find(option => option.chainId === chainId)
