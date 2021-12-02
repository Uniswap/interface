import { ChainId } from '@swapr/sdk'
import { NetworkOptions, networkOptionsPreset, NetworkOptionsPreset, NetworksList } from '../components/NetworkSwitcher'
import { NETWORK_DETAIL, SHOW_TESTNETS, TESTNETS } from '../constants'

export const getNetworkInfo = (chainId: ChainId, customPreset: NetworkOptionsPreset[] = networkOptionsPreset) => {
  const network = customPreset.find(net => {
    return net.chainId === chainId
  })
  return {
    name: network ? network.name : '',
    logoSrc: network ? network.logoSrc : '',
    color: network ? network.color : '',
    tag: network ? network.tag : '',
    isArbitrum: NETWORK_DETAIL[chainId].isArbitrum,
    partnerChainId: NETWORK_DETAIL[chainId].partnerChainId,
    rpcUrl: NETWORK_DETAIL[chainId].rpcUrls,
    iconUrls: NETWORK_DETAIL[chainId].iconUrls,
    nativeCurrency: {
      name: NETWORK_DETAIL[chainId].nativeCurrency.name,
      symbol: NETWORK_DETAIL[chainId].nativeCurrency.symbol,
      decimals: NETWORK_DETAIL[chainId].nativeCurrency.decimals
    }
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

export const getNetworkOptions = ({
  chainId,
  networkList
}: {
  chainId: ChainId
  networkList: NetworksList[]
}): Partial<NetworkOptions> => {
  const { name, logoSrc, color, tag } = getNetworkInfo(chainId)
  const selectedNetwork = getNetworkById(chainId, networkList)

  return {
    preset: { chainId, name, logoSrc, color, tag },
    active: selectedNetwork?.active,
    disabled: selectedNetwork?.disabled
  }
}

export const createNetworkOptions = ({
  networkPreset,
  selectedNetworkChainId,
  activeChainId,
  onNetworkChange,
  isNetworkDisabled
}: {
  networkPreset: NetworkOptionsPreset
  selectedNetworkChainId: ChainId
  activeChainId: ChainId | undefined
  onNetworkChange: (chainId: ChainId) => void
  isNetworkDisabled: (optionChainId: ChainId, selectedNetworkChainId: ChainId) => boolean
}): NetworkOptions => {
  const { chainId } = networkPreset
  return {
    preset: networkPreset,
    active: selectedNetworkChainId === activeChainId,
    disabled: isNetworkDisabled(networkPreset.chainId, selectedNetworkChainId),
    onClick: () => onNetworkChange(chainId)
  }
}

export const createNetworksList = ({
  networkOptionsPreset,
  selectedNetworkChainId,
  activeChainId,
  onNetworkChange,
  isNetworkDisabled,
  removeSpecifiedTag
}: {
  networkOptionsPreset: NetworkOptionsPreset[]
  selectedNetworkChainId: ChainId
  activeChainId: ChainId | undefined
  onNetworkChange: (chainId: ChainId) => void
  isNetworkDisabled: (optionChainId: ChainId, selectedNetworkChainId: ChainId) => boolean
  removeSpecifiedTag?: string
}): NetworksList[] => {
  let networks = networkOptionsPreset

  if (removeSpecifiedTag) {
    networks = networkOptionsPreset.map(item => {
      if (item.tag === removeSpecifiedTag) {
        return { ...item, tag: '' }
      }
      return item
    })
  }

  return networks
    .filter(network => SHOW_TESTNETS || !TESTNETS.includes(network.chainId))
    .reduce<NetworksList[]>((taggedList, currentNet) => {
      const tag = currentNet.tag ? currentNet.tag : ''
      const networkPreset = currentNet
      const enhancedNetworkOptions = createNetworkOptions({
        networkPreset,
        selectedNetworkChainId,
        activeChainId,
        onNetworkChange,
        isNetworkDisabled
      })

      // check if tag exist and if not create array
      const tagArrIndex = taggedList.findIndex(existingTagArr => existingTagArr.tag === tag)
      if (tagArrIndex > -1) {
        taggedList[tagArrIndex].networks.push(enhancedNetworkOptions)
      } else {
        taggedList.push({ tag, networks: [enhancedNetworkOptions] })
      }
      return taggedList
    }, [])
}
