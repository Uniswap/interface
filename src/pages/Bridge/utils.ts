import { ChainId } from '@swapr/sdk'
import {
  NetworkList,
  NetworkOptionProps,
  NetworkOptionsPreset,
  networkOptionsPreset
} from '../../components/NetworkSwitcher'
import { NETWORK_DETAIL } from '../../constants'

export enum BridgeStep {
  Initial,
  Collect,
  Success,
  Transfer
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

export const createNetworkOptionsList = ({
  value,
  setValue,
  activeChainId,
  option
}: {
  value: ChainId
  setValue: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
  option: NetworkOptionsPreset
}): NetworkOptionProps => {
  const { chainId: optionChainId, logoSrc, name } = option
  return {
    chainId: optionChainId,
    header: name,
    logoSrc: logoSrc,
    active: value === activeChainId,
    disabled: value === optionChainId,
    onClick: () => setValue(optionChainId)
  }
}

export const tagFilteredArray = ({
  value,
  setValue,
  activeChainId
}: {
  value: ChainId
  setValue: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
}): NetworkList[] => {
  return networkOptionsPreset.reduce<NetworkList[]>((taggedArray, currentNet) => {
    const tag = currentNet.tag ? currentNet.tag : 'mainnet'
    const option: NetworkOptionsPreset = currentNet
    const emhancedNet = createNetworkOptionsList({ value, setValue, activeChainId, option })
    // check if tag exist and if not create array
    const tagArrIndex = taggedArray.findIndex(existingTagArr => existingTagArr.tag === tag)
    if (tagArrIndex > -1) {
      taggedArray[tagArrIndex].networks.push(emhancedNet)
    } else {
      taggedArray.push({ tag, networks: [emhancedNet] })
    }

    return taggedArray
  }, [])
}
