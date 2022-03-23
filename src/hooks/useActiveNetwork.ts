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
import { UnsupportedChainIdError } from '@web3-react/core'

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
    blockExplorerUrls: ['https://etherscan.com'],
  },
  [ChainId.MATIC]: {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon.dmm.exchange/v1/mainnet/geth?appId=prod-dmm'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  [ChainId.BSCMAINNET]: {
    chainId: '0x38',
    chainName: 'BSC',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc.dmm.exchange/v1/mainnet/geth?appId=prod-dmm-interface'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  [ChainId.AVAXMAINNET]: {
    chainId: '0xA86A',
    chainName: 'Avalanche',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://avalanche.dmm.exchange/v1/mainnet/geth?appId=prod-dmm'],
    blockExplorerUrls: ['https://snowtrace.io'],
  },
  [ChainId.FANTOM]: {
    chainId: '0xFA',
    chainName: 'FANTOM',
    nativeCurrency: {
      name: 'FTM',
      symbol: 'FTM',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
  },
  [ChainId.CRONOS]: {
    chainId: '0x19',
    chainName: 'Cronos',
    nativeCurrency: {
      name: 'CRO',
      symbol: 'CRO',
      decimals: 18,
    },
    rpcUrls: ['https://evm-cronos.crypto.org'],
    blockExplorerUrls: ['https://cronoscan.com'],
  },
  [ChainId.AURORA]: {
    chainId: '0x4e454152',
    chainName: 'Aurora',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.aurora.dev/GvfzNcGULXzWqaVahC8WPTdqEuSmwNCu3Nu3rtcVv9MD'],
    blockExplorerUrls: ['https://aurorascan.dev'],
  },

  [ChainId.ARBITRUM]: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  [ChainId.BTTC]: {
    chainId: '0xc7',
    chainName: 'BitTorrent',
    nativeCurrency: {
      name: 'BTT',
      symbol: 'BTT',
      decimals: 18,
    },
    rpcUrls: ['https://bttc.dev.kyberengineering.io'],
    blockExplorerUrls: ['https://bttcscan.com'],
  },
  [ChainId.VELAS]: {
    chainId: '0x6a',
    chainName: 'Velas',
    nativeCurrency: {
      name: 'VLX',
      symbol: 'VLX',
      decimals: 18,
    },
    rpcUrls: ['https://evmexplorer.velas.com/rpc'],
    blockExplorerUrls: ['https://evmexplorer.velas.com'],
  },
  [ChainId.OASIS]: {
    chainId: '0xa516',
    chainName: 'Oasis',
    nativeCurrency: {
      name: 'ROSE',
      symbol: 'ROSE',
      decimals: 18,
    },
    rpcUrls: ['https://emerald.oasis.dev'],
    blockExplorerUrls: ['https://explorer.emerald.oasis.dev'],
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
  const { chainId, library, connector, error } = useActiveWeb3React()
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const dispatch = useAppDispatch()

  // Delete networkId from qs object
  const { networkId, ...qsWithoutNetworkId } = qs

  const target = {
    ...location,
    search: stringify({ ...qsWithoutNetworkId }),
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
      const isWrongNetwork = error instanceof UnsupportedChainIdError
      if (isNotConnected && !isWrongNetwork) {
        dispatch(updateChainIdWhenNotConnected(chainId))

        setTimeout(() => {
          history.push(targetRef.current)
        }, 3000)
        return
      }

      try {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [switchNetworkParams],
        })
        history.push(target)
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            await window.ethereum?.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams] })
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
    [dispatch, history, library, target, connector, error],
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return { changeNetwork }
}
