import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { ChainId } from '@uniswap/sdk-core'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NetworkLayer, UniverseChainId, WALLET_SUPPORTED_CHAIN_IDS, WalletChainId } from 'uniswap/src/types/chains'
import { isTestEnv } from 'utilities/src/environment'

export function toGraphQLChain(chainId: ChainId | number): Chain | undefined {
  switch (chainId) {
    case ChainId.MAINNET:
      return Chain.Ethereum
    case ChainId.ARBITRUM_ONE:
      return Chain.Arbitrum
    case ChainId.ARBITRUM_GOERLI:
      return Chain.Arbitrum
    case ChainId.GOERLI:
      return Chain.EthereumGoerli
    case ChainId.SEPOLIA:
      return Chain.EthereumSepolia
    case ChainId.OPTIMISM:
      return Chain.Optimism
    case ChainId.OPTIMISM_GOERLI:
      return Chain.Optimism
    case ChainId.POLYGON:
      return Chain.Polygon
    case ChainId.POLYGON_MUMBAI:
      return Chain.Polygon
    case ChainId.BASE:
      return Chain.Base
    case ChainId.BNB:
      return Chain.Bnb
    case ChainId.AVALANCHE:
      return Chain.Avalanche
    case ChainId.CELO:
      return Chain.Celo
    case ChainId.CELO_ALFAJORES:
      return Chain.Celo
    case ChainId.BLAST:
      return Chain.Blast
    case ChainId.ZORA:
      return Chain.Zora
    case ChainId.ZKSYNC:
      return Chain.Zksync
  }
  return undefined
}

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish): WalletChainId | null {
  // Support Goerli for testing
  const ids = isTestEnv() ? [UniverseChainId.Goerli, ...WALLET_SUPPORTED_CHAIN_IDS] : WALLET_SUPPORTED_CHAIN_IDS

  if (!chainId || !ids.map((c) => c.toString()).includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as WalletChainId
}

export function chainIdToHexadecimalString(chainId: WalletChainId): string {
  return BigNumber.from(chainId).toHexString()
}

export function hexadecimalStringToInt(hex: string): number {
  return parseInt(hex, 16)
}

export function isL2ChainId(chainId?: UniverseChainId): boolean {
  return chainId !== undefined && UNIVERSE_CHAIN_INFO[chainId].networkLayer === NetworkLayer.L2
}

export function isMainnetChainId(chainId?: UniverseChainId): boolean {
  return chainId === UniverseChainId.Mainnet
}

export function fromGraphQLChain(chain: Chain | undefined): WalletChainId | null {
  switch (chain) {
    case Chain.Ethereum:
      return UniverseChainId.Mainnet
    case Chain.Arbitrum:
      return UniverseChainId.ArbitrumOne
    case Chain.EthereumGoerli:
      return UniverseChainId.Goerli
    case Chain.Optimism:
      return UniverseChainId.Optimism
    case Chain.Polygon:
      return UniverseChainId.Polygon
    case Chain.Base:
      return UniverseChainId.Base
    case Chain.Bnb:
      return UniverseChainId.Bnb
    case Chain.Blast:
      return UniverseChainId.Blast
    case Chain.Avalanche:
      return UniverseChainId.Avalanche
    case Chain.Celo:
      return UniverseChainId.Celo
    case Chain.Zora:
      return UniverseChainId.Zora
    case Chain.Zksync:
      return UniverseChainId.Zksync
  }

  return null
}

export function getPollingIntervalByBlocktime(chainId?: WalletChainId): PollingInterval {
  return isMainnetChainId(chainId) ? PollingInterval.Fast : PollingInterval.LightningMcQueen
}

export function fromMoonpayNetwork(moonpayNetwork: string | undefined): WalletChainId | undefined {
  switch (moonpayNetwork) {
    case Chain.Arbitrum.toLowerCase():
      return UniverseChainId.ArbitrumOne
    case Chain.Optimism.toLowerCase():
      return UniverseChainId.Optimism
    case Chain.Polygon.toLowerCase():
      return UniverseChainId.Polygon
    case Chain.Bnb.toLowerCase():
      return UniverseChainId.Bnb
    // Moonpay still refers to BNB chain as BSC so including both BNB and BSC cases
    case 'bsc':
      return UniverseChainId.Bnb
    case Chain.Base.toLowerCase():
      return UniverseChainId.Base
    case Chain.Avalanche.toLowerCase():
      return UniverseChainId.Avalanche
    case Chain.Celo.toLowerCase():
      return UniverseChainId.Celo
    case undefined:
      return UniverseChainId.Mainnet
    default:
      return undefined
  }
}

export function fromUniswapWebAppLink(network: string | null): WalletChainId | null {
  switch (network) {
    case Chain.Ethereum.toLowerCase():
      return UniverseChainId.Mainnet
    case Chain.Arbitrum.toLowerCase():
      return UniverseChainId.ArbitrumOne
    case Chain.Optimism.toLowerCase():
      return UniverseChainId.Optimism
    case Chain.Polygon.toLowerCase():
      return UniverseChainId.Polygon
    case Chain.Base.toLowerCase():
      return UniverseChainId.Base
    case Chain.Bnb.toLowerCase():
      return UniverseChainId.Bnb
    case Chain.Blast.toLowerCase():
      return UniverseChainId.Blast
    case Chain.Avalanche.toLowerCase():
      return UniverseChainId.Avalanche
    case Chain.Celo.toLowerCase():
      return UniverseChainId.Celo
    case Chain.Zora.toLowerCase():
      return UniverseChainId.Zora
    case Chain.Zksync.toLowerCase():
      return UniverseChainId.Zksync
    default:
      throw new Error(`Network "${network}" can not be mapped`)
  }
}

export function toUniswapWebAppLink(chainId: WalletChainId): string | null {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return Chain.Ethereum.toLowerCase()
    case UniverseChainId.ArbitrumOne:
      return Chain.Arbitrum.toLowerCase()
    case UniverseChainId.Optimism:
      return Chain.Optimism.toLowerCase()
    case UniverseChainId.Polygon:
      return Chain.Polygon.toLowerCase()
    case UniverseChainId.Base:
      return Chain.Base.toLowerCase()
    case UniverseChainId.Bnb:
      return Chain.Bnb.toLowerCase()
    case UniverseChainId.Blast:
      return Chain.Blast.toLowerCase()
    case UniverseChainId.Avalanche:
      return Chain.Avalanche.toLowerCase()
    case UniverseChainId.Celo:
      return Chain.Celo.toLowerCase()
    case UniverseChainId.Zora:
      return Chain.Zora.toLowerCase()
    case UniverseChainId.Zksync:
      return Chain.Zksync.toLowerCase()
    default:
      throw new Error(`ChainID "${chainId}" can not be mapped`)
  }
}
