import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ChainId, SupportedChainsType } from '@uniswap/sdk-core'

import AppRpcProvider from './appProvider'
import { CHAIN_IDS_TO_NAMES } from './chains'
import { RPC_URLS } from './networks'

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key in SupportedChainsType]: AppRpcProvider } = {
  [ChainId.MAINNET]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.MAINNET][0], {
      chainId: ChainId.MAINNET,
      name: CHAIN_IDS_TO_NAMES[ChainId.MAINNET],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.MAINNET][1], {
      chainId: ChainId.MAINNET,
      name: CHAIN_IDS_TO_NAMES[ChainId.MAINNET],
    }),
  ]),
  [ChainId.GOERLI]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.GOERLI][0], {
      chainId: ChainId.GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.GOERLI],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.GOERLI][1], {
      chainId: ChainId.GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.GOERLI],
    }),
  ]),
  [ChainId.SEPOLIA]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.SEPOLIA][0], {
      chainId: ChainId.SEPOLIA,
      name: CHAIN_IDS_TO_NAMES[ChainId.SEPOLIA],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.SEPOLIA][1], {
      chainId: ChainId.SEPOLIA,
      name: CHAIN_IDS_TO_NAMES[ChainId.SEPOLIA],
    }),
  ]),
  [ChainId.OPTIMISM]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.OPTIMISM][0], {
      chainId: ChainId.OPTIMISM,
      name: CHAIN_IDS_TO_NAMES[ChainId.OPTIMISM],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.OPTIMISM][1], {
      chainId: ChainId.OPTIMISM,
      name: CHAIN_IDS_TO_NAMES[ChainId.OPTIMISM],
    }),
  ]),
  [ChainId.OPTIMISM_GOERLI]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.OPTIMISM_GOERLI][0], {
      chainId: ChainId.OPTIMISM_GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.OPTIMISM_GOERLI],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.OPTIMISM_GOERLI][1], {
      chainId: ChainId.OPTIMISM_GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.OPTIMISM_GOERLI],
    }),
  ]),
  [ChainId.ARBITRUM_ONE]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.ARBITRUM_ONE][0], {
      chainId: ChainId.ARBITRUM_ONE,
      name: CHAIN_IDS_TO_NAMES[ChainId.ARBITRUM_ONE],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.ARBITRUM_ONE][1], {
      chainId: ChainId.ARBITRUM_ONE,
      name: CHAIN_IDS_TO_NAMES[ChainId.ARBITRUM_ONE],
    }),
  ]),
  [ChainId.ARBITRUM_GOERLI]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.ARBITRUM_GOERLI][0], {
      chainId: ChainId.ARBITRUM_GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.ARBITRUM_GOERLI],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.ARBITRUM_GOERLI][1], {
      chainId: ChainId.ARBITRUM_GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.ARBITRUM_GOERLI],
    }),
  ]),
  [ChainId.POLYGON]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.POLYGON][0], {
      chainId: ChainId.POLYGON,
      name: CHAIN_IDS_TO_NAMES[ChainId.POLYGON],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.POLYGON][1], {
      chainId: ChainId.POLYGON,
      name: CHAIN_IDS_TO_NAMES[ChainId.POLYGON],
    }),
  ]),
  [ChainId.POLYGON_MUMBAI]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.POLYGON_MUMBAI][0], {
      chainId: ChainId.POLYGON_MUMBAI,
      name: CHAIN_IDS_TO_NAMES[ChainId.POLYGON_MUMBAI],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.POLYGON_MUMBAI][1], {
      chainId: ChainId.POLYGON_MUMBAI,
      name: CHAIN_IDS_TO_NAMES[ChainId.POLYGON_MUMBAI],
    }),
  ]),
  [ChainId.CELO]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.CELO][0], {
      chainId: ChainId.CELO,
      name: CHAIN_IDS_TO_NAMES[ChainId.CELO],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.CELO][1], {
      chainId: ChainId.CELO,
      name: CHAIN_IDS_TO_NAMES[ChainId.CELO],
    }),
  ]),
  [ChainId.CELO_ALFAJORES]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.CELO_ALFAJORES][0], {
      chainId: ChainId.CELO_ALFAJORES,
      name: CHAIN_IDS_TO_NAMES[ChainId.CELO_ALFAJORES],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.CELO_ALFAJORES][1], {
      chainId: ChainId.CELO_ALFAJORES,
      name: CHAIN_IDS_TO_NAMES[ChainId.CELO_ALFAJORES],
    }),
  ]),
  [ChainId.BNB]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.BNB][0], {
      chainId: ChainId.BNB,
      name: CHAIN_IDS_TO_NAMES[ChainId.BNB],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.BNB][1], {
      chainId: ChainId.BNB,
      name: CHAIN_IDS_TO_NAMES[ChainId.BNB],
    }),
  ]),
  [ChainId.AVALANCHE]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.AVALANCHE][0], {
      chainId: ChainId.AVALANCHE,
      name: CHAIN_IDS_TO_NAMES[ChainId.AVALANCHE],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.AVALANCHE][1], {
      chainId: ChainId.AVALANCHE,
      name: CHAIN_IDS_TO_NAMES[ChainId.AVALANCHE],
    }),
  ]),
  [ChainId.BASE]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.BASE][0], {
      chainId: ChainId.BASE,
      name: CHAIN_IDS_TO_NAMES[ChainId.BASE],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.BASE][1], {
      chainId: ChainId.BASE,
      name: CHAIN_IDS_TO_NAMES[ChainId.BASE],
    }),
  ]),
  [ChainId.BASE_GOERLI]: new AppRpcProvider([
    new StaticJsonRpcProvider(RPC_URLS[ChainId.BASE_GOERLI][0], {
      chainId: ChainId.BASE_GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.BASE_GOERLI],
    }),
    new StaticJsonRpcProvider(RPC_URLS[ChainId.BASE_GOERLI][1], {
      chainId: ChainId.BASE_GOERLI,
      name: CHAIN_IDS_TO_NAMES[ChainId.BASE_GOERLI],
    }),
  ]),
}
