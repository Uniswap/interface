import { ChainId } from '@uniswap/sdk-core'

import AppRpcProvider from './appProvider'
import { SupportedInterfaceChain } from './chains'
import { AppStaticJsonRpcProvider } from './extendedStaticJsonRpcProvider'
import { RPC_URLS } from './networks'

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key in SupportedInterfaceChain]: AppRpcProvider } = {
  [ChainId.MAINNET]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.MAINNET, RPC_URLS[ChainId.MAINNET][0]),
    new AppStaticJsonRpcProvider(ChainId.MAINNET, RPC_URLS[ChainId.MAINNET][1]),
  ]),
  [ChainId.GOERLI]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.GOERLI, RPC_URLS[ChainId.GOERLI][0]),
    new AppStaticJsonRpcProvider(ChainId.GOERLI, RPC_URLS[ChainId.GOERLI][1]),
  ]),
  [ChainId.SEPOLIA]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.SEPOLIA, RPC_URLS[ChainId.SEPOLIA][0]),
    new AppStaticJsonRpcProvider(ChainId.SEPOLIA, RPC_URLS[ChainId.SEPOLIA][1]),
  ]),
  [ChainId.OPTIMISM]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.OPTIMISM, RPC_URLS[ChainId.OPTIMISM][0]),
    new AppStaticJsonRpcProvider(ChainId.OPTIMISM, RPC_URLS[ChainId.OPTIMISM][1]),
  ]),
  [ChainId.OPTIMISM_GOERLI]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.OPTIMISM_GOERLI, RPC_URLS[ChainId.OPTIMISM_GOERLI][0]),
    new AppStaticJsonRpcProvider(ChainId.OPTIMISM_GOERLI, RPC_URLS[ChainId.OPTIMISM_GOERLI][1]),
  ]),
  [ChainId.ARBITRUM_ONE]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.ARBITRUM_ONE, RPC_URLS[ChainId.ARBITRUM_ONE][0]),
    new AppStaticJsonRpcProvider(ChainId.ARBITRUM_ONE, RPC_URLS[ChainId.ARBITRUM_ONE][1]),
  ]),
  [ChainId.ARBITRUM_GOERLI]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.ARBITRUM_GOERLI, RPC_URLS[ChainId.ARBITRUM_GOERLI][0]),
    new AppStaticJsonRpcProvider(ChainId.ARBITRUM_GOERLI, RPC_URLS[ChainId.ARBITRUM_GOERLI][1]),
  ]),
  [ChainId.POLYGON]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.POLYGON, RPC_URLS[ChainId.POLYGON][0]),
    new AppStaticJsonRpcProvider(ChainId.POLYGON, RPC_URLS[ChainId.POLYGON][1]),
  ]),
  [ChainId.POLYGON_MUMBAI]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.POLYGON_MUMBAI, RPC_URLS[ChainId.POLYGON_MUMBAI][0]),
    new AppStaticJsonRpcProvider(ChainId.POLYGON_MUMBAI, RPC_URLS[ChainId.POLYGON_MUMBAI][1]),
  ]),
  [ChainId.CELO]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.CELO, RPC_URLS[ChainId.CELO][0]),
    new AppStaticJsonRpcProvider(ChainId.CELO, RPC_URLS[ChainId.CELO][1]),
  ]),
  [ChainId.CELO_ALFAJORES]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.CELO_ALFAJORES, RPC_URLS[ChainId.CELO_ALFAJORES][0]),
    new AppStaticJsonRpcProvider(ChainId.CELO_ALFAJORES, RPC_URLS[ChainId.CELO_ALFAJORES][1]),
  ]),
  [ChainId.BNB]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.BNB, RPC_URLS[ChainId.BNB][0]),
    new AppStaticJsonRpcProvider(ChainId.BNB, RPC_URLS[ChainId.BNB][1]),
  ]),
  [ChainId.AVALANCHE]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.AVALANCHE, RPC_URLS[ChainId.AVALANCHE][0]),
    new AppStaticJsonRpcProvider(ChainId.AVALANCHE, RPC_URLS[ChainId.AVALANCHE][1]),
  ]),
  [ChainId.BASE]: new AppRpcProvider([
    new AppStaticJsonRpcProvider(ChainId.BASE, RPC_URLS[ChainId.BASE][0]),
    new AppStaticJsonRpcProvider(ChainId.BASE, RPC_URLS[ChainId.BASE][1]),
  ]),
}
