import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import ReactGA from 'react-ga'
import Web3Provider, { Connectors } from 'web3-react'

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

const { InjectedConnector, NetworkOnlyConnector } = Connectors
const Injected = new InjectedConnector({ supportedNetworks: [Number(process.env.REACT_APP_NETWORK_ID) || 1] })
const Infura = new NetworkOnlyConnector({
  providerURL: process.env.REACT_APP_NETWORK_URL || ''
})
const connectors = { Injected, Infura }

ReactDOM.render(
  <Provider store={store}>
    <Web3Provider connectors={connectors} libraryName="ethers.js">
      <App />
    </Web3Provider>
  </Provider>,
  document.getElementById('root')
)
