import { InjectedConnector } from '@web3-react/injected-connector'
import { AuthereumConnector } from '@web3-react/authereum-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { NetworkConnector } from './NetworkConnector'

export const INFURA_PROJECT_ID = '0ebf4dd05d6740f482938b8a80860d13'

export const network = new NetworkConnector({
  urls: {
    1: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    4: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`
  },
  defaultChainId: 1
})

export const injected = new InjectedConnector({
  supportedChainIds: [1, 4, 79377087078960]
})

// mainnet only
export const walletConnect = new WalletConnectConnector({
  rpc: {
    1: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

// mainnet only
export const authereum = new AuthereumConnector({ chainId: 1 })
