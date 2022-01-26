import { useCallback, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router'
import { stringify } from 'qs'

import { SupportedNetwork, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from './useParsedQueryString'
import { ChainId } from '@dynamic-amm/sdk'
import { useAppDispatch } from 'state/hooks'
import { updateChainIdWhenNotConnected } from 'state/application/actions'
import { isMobile } from 'react-device-detect'

export const SWITCH_NETWORK_PARAMS: {
  [chainId in ChainId]?: {
    chainId: string
  }
} = {
  [ChainId.MAINNET]: {
    chainId: '0x1'
  },
  [ChainId.MATIC]: {
    chainId: '0x89'
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38'
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A'
  },
  [ChainId.FANTOM]: {
    chainId: '0xFA'
  },
  [ChainId.CRONOS]: {
    chainId: '0x19'
  }
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
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://etherscan.com']
  },
  [ChainId.MATIC]: {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon.dmm.exchange/v1/mainnet/geth?appId=prod-dmm'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38',
    chainName: 'BSC',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc.dmm.exchange/v1/mainnet/geth?appId=prod-dmm-interface'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A',
    chainName: 'Avalanche',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://avalanche.dmm.exchange/v1/mainnet/geth?appId=prod-dmm'],
    blockExplorerUrls: ['https://snowtrace.io']
  },
  [ChainId.FANTOM]: {
    chainId: '0xFA',
    chainName: 'FANTOM',
    nativeCurrency: {
      name: 'FTM',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: ['https://rpcapi.fantom.network'],
    blockExplorerUrls: ['https://ftmscan.com']
  },
  [ChainId.CRONOS]: {
    chainId: '0x19',
    chainName: 'Cronos',
    nativeCurrency: {
      name: 'CRO',
      symbol: 'CRO',
      decimals: 18
    },
    rpcUrls: ['https://evm-cronos.crypto.org'],
    blockExplorerUrls: ['https://cronos.crypto.org/explorer']
  }
}

/**
 * Given a network string (e.g. from user agent), return the best match for corresponding SupportedNetwork
 * @param maybeSupportedNetwork the fuzzy network identifier
 */
function parseNetworkId(maybeSupportedNetwork: string): SupportedNetwork | undefined {
  return SUPPORTED_NETWORKS.find(network => network.toString() === maybeSupportedNetwork)
}

export function useActiveNetwork() {
  const { chainId, library, account, connector } = useActiveWeb3React()
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const dispatch = useAppDispatch()

  // Delete networkId from qs object
  const { networkId, ...qsWithoutNetworkId } = qs

  const target = {
    ...location,
    search: stringify({ ...qsWithoutNetworkId })
  }
  const targetRef = useRef(target)
  useEffect(() => {
    targetRef.current = target
  }, [target])

  const changeNetwork = useCallback(
    async (chainId: ChainId) => {
      // Disconnect wallet on mobile when switch chain
      if (isMobile && (connector as any)?.close) {
        await (connector as any).close()
        dispatch(updateChainIdWhenNotConnected(chainId))
        return
      }

      const switchNetworkParams = SWITCH_NETWORK_PARAMS[chainId]
      const addNetworkParams = ADD_NETWORK_PARAMS[chainId]

      const isNotConnected = !(library && library.provider && library.provider.isMetaMask)
      if (isNotConnected) {
        dispatch(updateChainIdWhenNotConnected(chainId))

        setTimeout(() => {
          history.push(targetRef.current)
        }, 3000)
        return
      }

      try {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [switchNetworkParams, account]
        })
        history.push(target)
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            await window.ethereum?.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams, account] })
            history.push(target)
          } catch (addError) {
            console.error(addError)
          }
        } else {
          // handle other "switch" errors
          console.error(switchError)
        }
      }
    },
    [account, dispatch, history, library, target, connector]
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return { changeNetwork }
}
