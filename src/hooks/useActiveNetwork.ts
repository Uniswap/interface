import { useCallback, useEffect, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router'
import { stringify } from 'qs'

import { SUPPORTED_NETWORKS, SupportedNetwork } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from './useParsedQueryString'
import { ChainId } from '@dynamic-amm/sdk'
import { useAppDispatch } from 'state/hooks'
import { updateChainIdWhenNotConnected } from 'state/application/actions'
import { UnsupportedChainIdError } from '@web3-react/core'
import { NETWORK_URLS } from 'connectors'
import { getExplorerUrl } from 'utils'

export const SWITCH_NETWORK_PARAMS: {
  [chainId in ChainId]?: {
    chainId: string
  }
} = {
  [ChainId.MAINNET]: {
    chainId: '0x1',
  },
  [ChainId.MATIC]: {
    chainId: '0x89',
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38',
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A',
  },
  [ChainId.FANTOM]: {
    chainId: '0xFA',
  },
  [ChainId.CRONOS]: {
    chainId: '0x19',
  },
  [ChainId.AURORA]: {
    chainId: '0x4e454152',
  },
  [ChainId.ARBITRUM]: {
    chainId: '0xa4b1',
  },
  [ChainId.BTTC]: {
    chainId: '0xc7',
  },
  [ChainId.VELAS]: {
    chainId: '0x6a',
  },
  [ChainId.OASIS]: {
    chainId: '0xa516',
  },
}

export const ADD_NETWORK_PARAMS: {
  [chainId in ChainId]?: {
    chainId: string
    chainName: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
} = {
  [ChainId.MAINNET]: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: [getExplorerUrl(ChainId.MAINNET)],
  },
  [ChainId.MATIC]: {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.MATIC]],
    blockExplorerUrls: [getExplorerUrl(ChainId.MATIC)],
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38',
    chainName: 'BSC',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.BSCMAINNET]],
    blockExplorerUrls: [getExplorerUrl(ChainId.BSCMAINNET)],
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A',
    chainName: 'Avalanche',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.AVAXMAINNET]],
    blockExplorerUrls: [getExplorerUrl(ChainId.AVAXMAINNET)],
  },
  [ChainId.FANTOM]: {
    chainId: '0xFA',
    chainName: 'FANTOM',
    nativeCurrency: {
      name: 'FTM',
      symbol: 'FTM',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.FANTOM]],
    blockExplorerUrls: [getExplorerUrl(ChainId.FANTOM)],
  },
  [ChainId.CRONOS]: {
    chainId: '0x19',
    chainName: 'Cronos',
    nativeCurrency: {
      name: 'CRO',
      symbol: 'CRO',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.CRONOS]],
    blockExplorerUrls: [getExplorerUrl(ChainId.CRONOS)],
  },
  [ChainId.AURORA]: {
    chainId: '0x4e454152',
    chainName: 'Aurora',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.AURORA]],
    blockExplorerUrls: [getExplorerUrl(ChainId.AURORA)],
  },

  [ChainId.ARBITRUM]: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.ARBITRUM]],
    blockExplorerUrls: [getExplorerUrl(ChainId.ARBITRUM)],
  },
  [ChainId.BTTC]: {
    chainId: '0xc7',
    chainName: 'BitTorrent',
    nativeCurrency: {
      name: 'BTT',
      symbol: 'BTT',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.BTTC]],
    blockExplorerUrls: [getExplorerUrl(ChainId.BTTC)],
  },
  [ChainId.VELAS]: {
    chainId: '0x6a',
    chainName: 'Velas',
    nativeCurrency: {
      name: 'VLX',
      symbol: 'VLX',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.VELAS]],
    blockExplorerUrls: [getExplorerUrl(ChainId.VELAS)],
  },
  [ChainId.OASIS]: {
    chainId: '0xa516',
    chainName: 'Oasis',
    nativeCurrency: {
      name: 'ROSE',
      symbol: 'ROSE',
      decimals: 18,
    },
    rpcUrls: [NETWORK_URLS[ChainId.OASIS]],
    blockExplorerUrls: [getExplorerUrl(ChainId.OASIS)],
  },
}

/**
 * Given a network string (e.g. from user agent), return the best match for corresponding SupportedNetwork
 * @param maybeSupportedNetwork the fuzzy network identifier
 */
function parseNetworkId(maybeSupportedNetwork: string): SupportedNetwork | undefined {
  return SUPPORTED_NETWORKS.find(network => network.toString() === maybeSupportedNetwork)
}

export function useActiveNetwork() {
  const { chainId, library, error } = useActiveWeb3React()
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const dispatch = useAppDispatch()

  const locationWithoutNetworkId = useMemo(() => {
    // Delete networkId from qs object
    const { networkId, ...qsWithoutNetworkId } = qs

    return { ...location, search: stringify({ ...qsWithoutNetworkId }) }
  }, [location])

  const changeNetwork = useCallback(
    async (chainId: ChainId) => {
      const switchNetworkParams = SWITCH_NETWORK_PARAMS[chainId]
      const addNetworkParams = ADD_NETWORK_PARAMS[chainId]

      const isNotConnected = !(library && library.provider)
      const isWrongNetwork = error instanceof UnsupportedChainIdError
      if (isNotConnected && !isWrongNetwork) {
        dispatch(updateChainIdWhenNotConnected(chainId))
      }

      if (library && library.provider && library.provider.request) {
        history.push(locationWithoutNetworkId)

        try {
          await library.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [switchNetworkParams],
          })
        } catch (switchError) {
          // This is a workaround solution for Coin98
          const isSwitcherror = typeof switchError === 'object' && Object.keys(switchError)?.length === 0
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902 || switchError.code === -32603 || isSwitcherror) {
            try {
              await library.provider.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams] })
            } catch (addError) {
              console.error(addError)
            }
          } else {
            // handle other "switch" errors
            console.error(switchError)
          }
        }
      }
    },
    [dispatch, history, library, locationWithoutNetworkId, error],
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return { changeNetwork }
}
