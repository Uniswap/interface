import { initializeConnector } from '@web3-react/core'
import { Network } from '@web3-react/network'
import { SupportedChainId } from 'constants/chains'

export const URLS = {
  [SupportedChainId.MAINNET]: [`https://mainnet.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  [SupportedChainId.ROPSTEN]: [`https://ropsten.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  [SupportedChainId.RINKEBY]: [`https://rinkeby.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  [SupportedChainId.GOERLI]: [`https://goerli.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  [SupportedChainId.KOVAN]: [`https://kovan.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  [SupportedChainId.OPTIMISM]: [`https://optimism-mainnet.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  // [SupportedChainId.]: [`https://polygon-mainnet.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
  [SupportedChainId.ARBITRUM_ONE]: [`https://arbitrum-mainnet.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`],
}

export const [network, hooks] = initializeConnector<Network>(
  (actions) => new Network(actions, URLS),
  Object.keys(URLS).map((chainId) => parseInt(chainId, 10))
)
