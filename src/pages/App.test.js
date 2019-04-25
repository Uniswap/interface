import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import Web3Provider, { Connectors } from 'web3-react'

import App from './App'
import store from '../store'

// TODO, fix this hacky workaround
const { NetworkOnlyConnector } = Connectors
const Injected = new NetworkOnlyConnector({
  providerURL: process.env.REACT_APP_NETWORK_URL
})
export const connectors = { Injected }

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(
    <Provider store={store}>
      <Web3Provider connectors={connectors} libraryName="ethers.js">
        <App />
      </Web3Provider>
    </Provider>,
    div
  )
  ReactDOM.unmountComponentAtNode(div)
})
