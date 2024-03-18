import { BigNumber, BigNumberish } from 'ethers'
import {
  ALL_SUPPORTED_CHAINS,
  ChainId,
  L2ChainId,
  L2_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
} from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'

import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish): ChainId | null {
  if (!chainId || !ALL_SUPPORTED_CHAINS.includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as ChainId
}

export function chainIdToHexadecimalString(chainId: ChainId): string {
  return BigNumber.from(chainId).toHexString()
}

export const isL2Chain = (chainId?: ChainId): boolean =>
  Boolean(chainId && L2_CHAIN_IDS.includes(chainId as L2ChainId))

export function isTestnet(chainId?: ChainId): boolean {
  if (!chainId) {
    return false
  }

  return TESTNET_CHAIN_IDS.includes(chainId)
}

export function fromGraphQLChain(chain: Chain | undefined): ChainId | null {
  switch (chain) {
    case Chain.Ethereum:
      return ChainId.Mainnet
    case Chain.Arbitrum:
      return ChainId.ArbitrumOne
    case Chain.EthereumGoerli:
      return ChainId.Goerli
    case Chain.Optimism:
      return ChainId.Optimism
    case Chain.Polygon:
      return ChainId.Polygon
    case Chain.Base:
      return ChainId.Base
    case Chain.Bnb:
      return ChainId.Bnb
  }

  return null
}

export function toGraphQLChain(chainId: ChainId): Chain | null {
  switch (chainId) {
    case ChainId.Mainnet:
      return Chain.Ethereum
    case ChainId.ArbitrumOne:
      return Chain.Arbitrum
    case ChainId.Goerli:
      return Chain.EthereumGoerli
    case ChainId.Optimism:
      return Chain.Optimism
    case ChainId.Polygon:
      return Chain.Polygon
    case ChainId.Base:
      return Chain.Base
    case ChainId.Bnb:
      return Chain.Bnb
  }
  return null
}

export function getPollingIntervalByBlocktime(chainId?: ChainId): PollingInterval {
  return isL2Chain(chainId) ? PollingInterval.LightningMcQueen : PollingInterval.Fast
}

export function fromMoonpayNetwork(moonpayNetwork: string | undefined): ChainId | undefined {
  switch (moonpayNetwork) {
    case Chain.Arbitrum.toLowerCase():
      return ChainId.ArbitrumOne
    case Chain.Optimism.toLowerCase():
      return ChainId.Optimism
    case Chain.Polygon.toLowerCase():
      return ChainId.Polygon
    case Chain.Bnb.toLowerCase():
      return ChainId.Bnb
    // Moonpay still refers to BNB chain as BSC so including both BNB and BSC cases
    case 'bsc':
      return ChainId.Bnb
    case Chain.Base.toLowerCase():
      return ChainId.Base
    case undefined:
      return ChainId.Mainnet
    default:
      return undefined
  }
}

export function fromUniswapWebAppLink(network: string | null): ChainId | null {
  switch (network) {
    case Chain.Ethereum.toLowerCase():
      return ChainId.Mainnet
    case Chain.Arbitrum.toLowerCase():
      return ChainId.ArbitrumOne
    case Chain.Optimism.toLowerCase():
      return ChainId.Optimism
    case Chain.Polygon.toLowerCase():
      return ChainId.Polygon
    case Chain.Base.toLowerCase():
      return ChainId.Base
    case Chain.Bnb.toLowerCase():
      return ChainId.Bnb
    default:
      throw new Error(`Network "${network}" can not be mapped`)
  }
}

export function toUniswapWebAppLink(chainId: ChainId): string | null {
  switch (chainId) {
    case ChainId.Mainnet:
      return Chain.Ethereum.toLowerCase()
    case ChainId.ArbitrumOne:
      return Chain.Arbitrum.toLowerCase()
    case ChainId.Optimism:
      return Chain.Optimism.toLowerCase()
    case ChainId.Polygon:
      return Chain.Polygon.toLowerCase()
    case ChainId.Base:
      return Chain.Base.toLowerCase()
    case ChainId.Bnb:
      return Chain.Bnb.toLowerCase()
    default:
      throw new Error(`ChainID "${chainId}" can not be mapped`)
  }
}
