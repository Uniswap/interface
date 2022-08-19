import { JsonRpcProvider } from '@ethersproject/providers'

import { SupportedChainId } from './chains'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
export const MAINNET_PROVIDER = new JsonRpcProvider(`https://ethereum.keydonix.com/v1/mainnet`)

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const RPC_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: `https://ethereum.keydonix.com/v1/mainnet`,
  [SupportedChainId.RINKEBY]: `https://ethereum.keydonix.com/v1/rinkeby`,
  [SupportedChainId.GOERLI]: `https://ethereum.keydonix.com/v1/goerli`,
  [SupportedChainId.ROPSTEN]: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.KOVAN]: `https://kovan.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.OPTIMISTIC_KOVAN]: `https://optimism-kovan.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.ARBITRUM_ONE]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.ARBITRUM_RINKEBY]: `https://arbitrum-rinkeby.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.POLYGON]: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.POLYGON_MUMBAI]: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.CELO]: `https://forno.celo.org`,
  [SupportedChainId.CELO_ALFAJORES]: `https://alfajores-forno.celo-testnet.org`,
}
