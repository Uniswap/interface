import { ChainId } from '@swapr/sdk'
import {
  NetworksList,
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

export const getNetworkInfo = (chainId: ChainId) => {
  const net = networkOptionsPreset.find(net => {
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
    logoSrc: net?.logoSrc,
    tag: net?.tag
  }
}

export const getNetworkById = (chainId: ChainId, networkList: NetworksList[]) => {
  for (const { networks } of networkList) {
    for (const config of networks) {
      if (config.chainId === chainId) return config
    }
  }
  return undefined
}

const isNetDisabled = (optionChainId: ChainId, value: ChainId) => {
  return (
    value === optionChainId ||
    getNetworkInfo(optionChainId).tag === 'coming soon' ||
    !getNetworkInfo(optionChainId).partnerChainId
  )
}

export const createNetworkOptionsList = ({
  selectedNetChainId,
  setChainId,
  activeChainId,
  options
}: {
  selectedNetChainId: ChainId
  setChainId: (chainId: ChainId) => void
  activeChainId: ChainId | undefined
  options: NetworkOptionsPreset
}): NetworkOptionProps => {
  const { chainId: optionChainId, logoSrc, name } = options
  return {
    chainId: optionChainId,
    header: name,
    logoSrc: logoSrc,
    active: selectedNetChainId === activeChainId,
    disabled: isNetDisabled(optionChainId, selectedNetChainId),
    onClick: () => setChainId(optionChainId)
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
  return networkOptionsPreset.reduce<NetworksList[]>((taggedArray, currentNet) => {
    const tag = currentNet.tag ? currentNet.tag : ''
    const options: NetworkOptionsPreset = currentNet
    const enhancedNet = createNetworkOptionsList({ selectedNetChainId, setChainId, activeChainId, options })

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
