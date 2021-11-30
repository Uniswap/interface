import { ChainId } from '@swapr/sdk'
import { NetworkOptions, NetworkOptionsPreset, NetworksList } from '../components/NetworkSwitcher'
import { NETWORK_DETAIL } from '../constants'

export const getNetworkInfo = (networkOptionsPreset: NetworkOptionsPreset[], chainId: ChainId) => {
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

export const createNetworkOptions = ({
  selectedNetworkChainId,
  setChainId,
  activeChainId,
  networkPreset,
  isNetworkDisabled
}: {
  selectedNetworkChainId: ChainId
  setChainId: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
  networkPreset: NetworkOptionsPreset
  isNetworkDisabled: (chainId: ChainId, selectedNetworkChainId: ChainId) => boolean
}): NetworkOptions => {
  const { chainId } = networkPreset
  return {
    preset: networkPreset,
    active: selectedNetworkChainId === activeChainId,
    disabled: isNetworkDisabled(chainId, selectedNetworkChainId),
    onClick: () => setChainId(chainId)
  }
}

export const createNetworksList = ({
  networkOptionsPreset,
  selectedNetworkChainId,
  setChainId,
  activeChainId,
  isNetworkDisabled
}: {
  networkOptionsPreset: NetworkOptionsPreset[]
  selectedNetworkChainId: ChainId
  setChainId: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
  isNetworkDisabled: () => boolean
}): NetworksList[] => {
  // const changed = networkOptionsPreset.map(item => {
  //   if (item.tag === 'coming soon') {
  //     return { ...item, tag: '' }
  //   }
  //   return item
  // })
  return networkOptionsPreset.reduce<NetworksList[]>((taggedArray, currentNet) => {
    const tag = currentNet.tag ? currentNet.tag : ''
    const networkPreset: NetworkOptionsPreset = currentNet
    const enhancedNetworkOptions = createNetworkOptions({
      selectedNetworkChainId,
      setChainId,
      activeChainId,
      networkPreset,
      isNetworkDisabled
    })

    // check if tag exist and if not create array
    const tagArrIndex = taggedArray.findIndex(existingTagArr => existingTagArr.tag === tag)
    if (tagArrIndex > -1) {
      taggedArray[tagArrIndex].networks.push(enhancedNetworkOptions)
    } else {
      taggedArray.push({ tag, networks: [enhancedNetworkOptions] })
    }

    return taggedArray
  }, [])
}
