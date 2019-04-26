import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import ReactGA from 'react-ga'
import Web3Provider, { Connectors } from 'web3-react'
import WalletConnectApi from '@walletconnect/web3-subprovider'

import './i18n'
import App from './pages/App'
import store from './store'
import './index.scss'

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
} else {
  ReactGA.initialize('test', { testMode: true })
}
ReactGA.pageview(window.location.pathname + window.location.search)

const { WalletConnectConnector } = Connectors
const WalletConnect = new WalletConnectConnector({
  api: WalletConnectApi,
  bridge: 'https://bridge.walletconnect.org',
  supportedNetworkURLs: {
    1: process.env.REACT_APP_NETWORK_URL
  },
  defaultNetwork: 1
})
const connectors = { WalletConnect }

ReactDOM.render(
  <Provider store={store}>
    <Web3Provider connectors={connectors} libraryName="ethers.js">
      <App />
    </Web3Provider>
  </Provider>,
  document.getElementById('root')
)
