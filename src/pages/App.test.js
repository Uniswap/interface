import React from 'react'
import ReactDOM from 'react-dom'
import Web3Provider, { Connectors } from 'web3-react'

import App from './App'

// TODO, fix this hacky workaround
const { NetworkOnlyConnector } = Connectors
const Injected = new NetworkOnlyConnector({
  providerURL: process.env.REACT_APP_NETWORK_URL
})
export const connectors = { Injected }

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(
    <Web3Provider connectors={connectors} libraryName="ethers.js">
      <App />
    </Web3Provider>,
    div
  )
  ReactDOM.unmountComponentAtNode(div)
})
