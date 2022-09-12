import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { SupportedChainId } from './chains'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const RPC_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.RINKEBY]: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.ROPSTEN]: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
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

export const RPC_PROVIDERS: { [key in SupportedChainId]: StaticJsonRpcProvider } = {
  [SupportedChainId.MAINNET]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.MAINNET]),
  [SupportedChainId.RINKEBY]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.RINKEBY]),
  [SupportedChainId.ROPSTEN]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.ROPSTEN]),
  [SupportedChainId.GOERLI]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.GOERLI]),
  [SupportedChainId.KOVAN]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.KOVAN]),
  [SupportedChainId.OPTIMISM]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.OPTIMISM]),
  [SupportedChainId.OPTIMISTIC_KOVAN]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.OPTIMISTIC_KOVAN]),
  [SupportedChainId.ARBITRUM_ONE]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.ARBITRUM_ONE]),
  [SupportedChainId.ARBITRUM_RINKEBY]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.ARBITRUM_RINKEBY]),
  [SupportedChainId.POLYGON]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.POLYGON]),
  [SupportedChainId.POLYGON_MUMBAI]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.POLYGON_MUMBAI]),
  [SupportedChainId.CELO]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.CELO]),
  [SupportedChainId.CELO_ALFAJORES]: new StaticJsonRpcProvider(RPC_URLS[SupportedChainId.CELO_ALFAJORES]),
}
