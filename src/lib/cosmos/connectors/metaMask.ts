import { initializeConnector } from 'widgets-web3-react/core'
import { MetaMask } from 'widgets-web3-react/metamask'

export const [metaMask, hooks] = initializeConnector<MetaMask>((actions) => new MetaMask(actions))
