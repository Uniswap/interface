import React from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import Web3Provider from 'web3-react'
import WalletConnectApi from '@walletconnect/web3-subprovider'

import ThemeProvider, { GlobalStyle } from './theme'
import LocalStorageContextProvider, { Updater as LocalStorageContextUpdater } from './contexts/LocalStorage'
import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
import TokensContextProvider from './contexts/Tokens'
import BalancesContextProvider from './contexts/Balances'
import AllowancesContextProvider from './contexts/Allowances'
import AllBalancesContextProvider from './contexts/AllBalances'
import WalletModalContextProvider from './contexts/Wallet'

import App from './pages/App'
import NetworkOnlyConnector from './NetworkOnlyConnector'
import InjectedConnector from './InjectedConnector'
import WalletConnectConnector from './WalletConnectConnector'
import WalletLinkConnector from './WalletLinkConnector'

import './i18n'

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
} else {
  ReactGA.initialize('test', { testMode: true })
}
ReactGA.pageview(window.location.pathname + window.location.search)

const supportedNetworkURLs = {
  1: 'https://mainnet.infura.io/v3/60ab76e16df54c808e50a79975b4779f',
  4: 'https://rinkeby.infura.io/v3/60ab76e16df54c808e50a79975b4779f'
}
const WALLET_CONNECT_BRIDGE = 'https://bridge.walletconnect.org'

const Network = new NetworkOnlyConnector({ providerURL: process.env.REACT_APP_NETWORK_URL || '' })
const Injected = new InjectedConnector({ supportedNetworks: [Number(process.env.REACT_APP_NETWORK_ID || '1')] })
const WalletLink = new WalletLinkConnector()
const WalletConnect = new WalletConnectConnector({
  api: WalletConnectApi,
  bridge: WALLET_CONNECT_BRIDGE,
  supportedNetworkURLs: supportedNetworkURLs,
  defaultNetwork: 1
})

const connectors = { Injected, Network, WalletConnect, WalletLink }

function ContextProviders({ children }) {
  return (
    <LocalStorageContextProvider>
      <ApplicationContextProvider>
        <TransactionContextProvider>
          <TokensContextProvider>
            <WalletModalContextProvider>
              <BalancesContextProvider>
                <AllBalancesContextProvider>
                  <AllowancesContextProvider>{children}</AllowancesContextProvider>
                </AllBalancesContextProvider>
              </BalancesContextProvider>
            </WalletModalContextProvider>
          </TokensContextProvider>
        </TransactionContextProvider>
      </ApplicationContextProvider>
    </LocalStorageContextProvider>
  )
}

function Updaters() {
  return (
    <>
      <LocalStorageContextUpdater />
      <ApplicationContextUpdater />
      <TransactionContextUpdater />
    </>
  )
}

ReactDOM.render(
  <Web3Provider connectors={connectors} libraryName="ethers.js">
    <ContextProviders>
      <Updaters />
      <ThemeProvider>
        <>
          <GlobalStyle />
          <App />
        </>
      </ThemeProvider>
    </ContextProviders>
  </Web3Provider>,
  document.getElementById('root')
)
