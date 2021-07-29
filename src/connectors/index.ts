import { InjectedConnector } from '@web3-react/injected-connector'
import { AuthereumConnector } from '@web3-react/authereum-connector'
import { CustomNetworkConnector } from './CustomNetworkConnector'
import { CustomWalletConnectConnector } from './CustomWalletConnectConnector'
import { ChainId } from 'dxswap-sdk'
import { providers } from 'ethers'
import getLibrary from '../utils/getLibrary'

export const INFURA_PROJECT_ID = '0ebf4dd05d6740f482938b8a80860d13'

export const network = new CustomNetworkConnector({
  urls: {
    [ChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    [ChainId.XDAI]: 'https://rpc.xdaichain.com/',
    [ChainId.ARBITRUM_ONE]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.ARBITRUM_RINKEBY]: 'https://rinkeby.arbitrum.io/rpc'
  },
  defaultChainId: ChainId.MAINNET
})

export const injected = new InjectedConnector({
  supportedChainIds: [ChainId.MAINNET, ChainId.RINKEBY, ChainId.ARBITRUM_ONE, ChainId.ARBITRUM_RINKEBY, ChainId.XDAI]
})

// mainnet only
export const walletConnect = new CustomWalletConnectConnector({
  rpc: {
    [ChainId.XDAI]: 'https://rpc.xdaichain.com/',
    [ChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

// mainnet only
export const authereum = new AuthereumConnector({ chainId: 1 })

let networkLibrary: providers.Web3Provider | undefined
export function getNetworkLibrary(): providers.Web3Provider {
  return (networkLibrary = networkLibrary ?? getLibrary(network.provider))
}
