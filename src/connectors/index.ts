// import { SafeAppConnector } from '@gnosis.pm/safe-apps-web3-react'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { WalletConnect } from '@web3-react/walletconnect'
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'

import UNISWAP_LOGO_URL from '../assets/svg/logo.svg'
// import { FortmaticConnector } from './Fortmatic'

// const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY

export const [network, networkHooks] = initializeConnector<Network>(
  (actions) => new Network(actions, INFURA_NETWORK_URLS, true, 1),
  Object.keys(INFURA_NETWORK_URLS).map((chainId) => Number(chainId))
)

export const [injected, injectedHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask(actions, true),
  ALL_SUPPORTED_CHAIN_IDS
)

// export const gnosisSafe = new SafeAppConnector()

// // mainnet only
// export const fortmatic = new FortmaticConnector({
//   apiKey: FORMATIC_KEY ?? '',
//   chainId: 1,
// })

export const [walletConnect, walletConnectHooks] = initializeConnector<WalletConnect>(
  (actions) =>
    new WalletConnect(
      actions,
      {
        rpc: INFURA_NETWORK_URLS,
        qrcode: true,
      },
      true
    ),
  ALL_SUPPORTED_CHAIN_IDS
)

export const [coinbaseWallet, coinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet(
      actions,
      {
        url: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
        appName: 'Uniswap',
        appLogoUrl: UNISWAP_LOGO_URL,
      },
      true
    ),
  ALL_SUPPORTED_CHAIN_IDS
)

export const connectors: [MetaMask | WalletConnect | CoinbaseWallet | Network, Web3ReactHooks][] = [
  [injected, injectedHooks],
  [walletConnect, walletConnectHooks],
  [coinbaseWallet, coinbaseWalletHooks],
  [network, networkHooks],
]
