import { ChainId } from '@swapr/sdk'
import {
  NetworksList,
  NetworkOptionsPreset,
  networkOptionsPreset,
  NetworkOptions
} from '../../components/NetworkSwitcher'
import { NETWORK_DETAIL } from '../../constants'

export enum BridgeStep {
  Initial,
  Collect,
  Success,
  Transfer
}

export const getNetworkInfo = (chainId: ChainId) => {
  const network = networkOptionsPreset.find(net => {
    return net.chainId === chainId
  })
  return {
    name: NETWORK_DETAIL[chainId].chainName,
    isArbitrum: NETWORK_DETAIL[chainId].isArbitrum,
    partnerChainId: NETWORK_DETAIL[chainId].partnerChainId,
    rpcUrl: NETWORK_DETAIL[chainId].rpcUrls,
    iconUrls: NETWORK_DETAIL[chainId].iconUrls,
    nativeCurrency: {
      name: NETWORK_DETAIL[chainId].nativeCurrency.name,
      symbol: NETWORK_DETAIL[chainId].nativeCurrency.symbol,
      decimals: NETWORK_DETAIL[chainId].nativeCurrency.decimals
    },
    logoSrc: network?.logoSrc,
    tag: network?.tag
  }
}

export const getNetworkById = (chainId: ChainId, networkList: NetworksList[]) => {
  for (const { networks } of networkList) {
    for (const config of networks) {
      if (config.preset.chainId === chainId) return config
    }
  }
  return undefined
}

export const isNetworkDisabled = (optionChainId: ChainId, selectedNetworkChainId: ChainId) => {
  return (
    selectedNetworkChainId === optionChainId ||
    getNetworkInfo(optionChainId).tag === 'coming soon' ||
    !getNetworkInfo(optionChainId).partnerChainId
  )
}

export const createNetworkOptionsList = ({
  selectedNetChainId,
  setChainId,
  activeChainId,
  preset
}: {
  selectedNetChainId: ChainId
  setChainId: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
  preset: NetworkOptionsPreset
}): NetworkOptions => {
  const { chainId } = preset
  return {
    preset: preset,
    active: selectedNetChainId === activeChainId,
    disabled: isNetworkDisabled(chainId, selectedNetChainId),
    onClick: () => setChainId(chainId)
  }
}

export const createEnhancedNetsArray = ({
  selectedNetChainId,
  setChainId,
  activeChainId
}: {
  selectedNetChainId: ChainId
  setChainId: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
}): NetworksList[] => {
  // const changed = networkOptionsPreset.map(item => {
  //   if (item.tag === 'coming soon') {
  //     return { ...item, tag: '' }
  //   }
  //   return item
  // })
  return networkOptionsPreset.reduce<NetworksList[]>((taggedArray, currentNet) => {
    const tag = currentNet.tag ? currentNet.tag : ''
    const preset: NetworkOptionsPreset = currentNet
    const enhancedNet = createNetworkOptionsList({ selectedNetChainId, setChainId, activeChainId, preset })

    // check if tag exist and if not create array
    const tagArrIndex = taggedArray.findIndex(existingTagArr => existingTagArr.tag === tag)
    if (tagArrIndex > -1) {
      taggedArray[tagArrIndex].networks.push(enhancedNet)
    } else {
      taggedArray.push({ tag, networks: [enhancedNet] })
    }

    return taggedArray
  }, [])
}
