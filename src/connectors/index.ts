import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { WalletConnect } from '@web3-react/walletconnect'
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'

import UNISWAP_LOGO_URL from '../assets/svg/logo.svg'

export const [network, networkHooks] = initializeConnector<Network>(
  (actions) => new Network(actions, INFURA_NETWORK_URLS, true, 1),
  Object.keys(INFURA_NETWORK_URLS).map((chainId) => Number(chainId))
)

export const [injected, injectedHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask(actions, true),
  ALL_SUPPORTED_CHAIN_IDS
)

export const [gnosisSafe, gnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe(actions, true))

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

// this is an ordered priority list. network connector should be at the top because we want to always
// pass in a walletOverride manually for the connected wallet
export const connectors: [GnosisSafe | MetaMask | WalletConnect | CoinbaseWallet | Network, Web3ReactHooks][] = [
  [network, networkHooks],
  [gnosisSafe, gnosisSafeHooks],
  [injected, injectedHooks],
  [walletConnect, walletConnectHooks],
  [coinbaseWallet, coinbaseWalletHooks],
]
