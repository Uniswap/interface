import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { ChainId } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import {
  GQL_MAINNET_CHAINS_MUTABLE,
  GQL_TESTNET_CHAINS_MUTABLE,
  UNIVERSE_CHAIN_INFO,
} from 'uniswap/src/constants/chains'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import {
  COMBINED_CHAIN_IDS,
  InterfaceGqlChain,
  NetworkLayer,
  SUPPORTED_CHAIN_IDS,
  SUPPORTED_TESTNET_CHAIN_IDS,
  UniverseChainId,
} from 'uniswap/src/types/chains'

export function toGraphQLChain(chainId: ChainId | number): Chain | undefined {
  switch (chainId) {
    case ChainId.MAINNET:
      return Chain.Ethereum
    case ChainId.SEPOLIA:
      return Chain.EthereumSepolia
    case ChainId.ARBITRUM_ONE:
      return Chain.Arbitrum
    case ChainId.OPTIMISM:
      return Chain.Optimism
    case ChainId.POLYGON:
      return Chain.Polygon
    case ChainId.BASE:
      return Chain.Base
    case ChainId.BNB:
      return Chain.Bnb
    case ChainId.AVALANCHE:
      return Chain.Avalanche
    case ChainId.CELO:
      return Chain.Celo
    case ChainId.BLAST:
      return Chain.Blast
    case ChainId.WORLDCHAIN:
      return Chain.Worldchain
    case ChainId.ZORA:
      return Chain.Zora
    case ChainId.ZKSYNC:
      return Chain.Zksync
    case ChainId.ASTROCHAIN_SEPOLIA:
      return Chain.AstrochainSepolia
  }
  return undefined
}

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish): UniverseChainId | null {
  const ids = COMBINED_CHAIN_IDS

  if (!chainId || !ids.map((c) => c.toString()).includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as UniverseChainId
}

export function chainIdToHexadecimalString(chainId: UniverseChainId): string {
  return BigNumber.from(chainId).toHexString()
}

export function hexadecimalStringToInt(hex: string): number {
  return parseInt(hex, 16)
}

export function isL2ChainId(chainId?: UniverseChainId): boolean {
  return chainId !== undefined && UNIVERSE_CHAIN_INFO[chainId].networkLayer === NetworkLayer.L2
}

export function isMainnetChainId(chainId?: UniverseChainId): boolean {
  return chainId === UniverseChainId.Mainnet || chainId === UniverseChainId.Sepolia
}

export function fromGraphQLChain(chain: Chain | string | undefined): UniverseChainId | null {
  switch (chain) {
    case Chain.Ethereum:
      return UniverseChainId.Mainnet
    case Chain.Arbitrum:
      return UniverseChainId.ArbitrumOne
    case Chain.EthereumSepolia:
      return UniverseChainId.Sepolia
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
    case Chain.Worldchain:
      return UniverseChainId.WorldChain
    case Chain.Zora:
      return UniverseChainId.Zora
    case Chain.Zksync:
      return UniverseChainId.Zksync
    case Chain.AstrochainSepolia:
      return UniverseChainId.AstrochainSepolia
  }

  return null
}

export function getPollingIntervalByBlocktime(chainId?: UniverseChainId): PollingInterval {
  return isMainnetChainId(chainId) ? PollingInterval.Fast : PollingInterval.LightningMcQueen
}

export function fromUniswapWebAppLink(network: string | null): UniverseChainId | null {
  switch (network) {
    case Chain.Ethereum.toLowerCase():
      return UniverseChainId.Mainnet
    case Chain.EthereumSepolia.toLowerCase():
      return UniverseChainId.Sepolia
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
    case Chain.Worldchain.toLowerCase():
      return UniverseChainId.WorldChain
    case Chain.Zora.toLowerCase():
      return UniverseChainId.Zora
    case Chain.Zksync.toLowerCase():
      return UniverseChainId.Zksync
    case Chain.AstrochainSepolia.toLowerCase():
      return UniverseChainId.AstrochainSepolia
    default:
      throw new Error(`Network "${network}" can not be mapped`)
  }
}

export function toUniswapWebAppLink(chainId: UniverseChainId): string | null {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return Chain.Ethereum.toLowerCase()
    case UniverseChainId.Sepolia:
      return Chain.EthereumSepolia.toLowerCase()
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
    case UniverseChainId.WorldChain:
      return Chain.Worldchain.toLowerCase()
    case UniverseChainId.Zora:
      return Chain.Zora.toLowerCase()
    case UniverseChainId.Zksync:
      return Chain.Zksync.toLowerCase()
    case UniverseChainId.AstrochainSepolia:
      return Chain.AstrochainSepolia.toLowerCase()
    default:
      throw new Error(`ChainID "${chainId}" can not be mapped`)
  }
}

type ActiveChainIdFeatureFlags = UniverseChainId.WorldChain

export function filterChainIdsByFeatureFlag(featureFlaggedChainIds: {
  [UniverseChainId.WorldChain]: boolean
}): UniverseChainId[] {
  return COMBINED_CHAIN_IDS.filter((chainId) => {
    return featureFlaggedChainIds[chainId as ActiveChainIdFeatureFlags] ?? true
  })
}

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
export function useFeatureFlaggedChainIds(): UniverseChainId[] {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
  // IMPORTANT: Don't forget to also update getEnabledChainIdsSaga

  const worldChainEnabled = useFeatureFlag(FeatureFlags.WorldChain)

  return useMemo(
    () =>
      filterChainIdsByFeatureFlag({
        [UniverseChainId.WorldChain]: worldChainEnabled,
      }),
    [worldChainEnabled],
  )
}

export function getEnabledChains({
  isTestnetModeEnabled,
  featureFlaggedChainIds,
  connectedWalletChainIds,
}: {
  isTestnetModeEnabled: boolean
  featureFlaggedChainIds: UniverseChainId[]
  connectedWalletChainIds?: UniverseChainId[]
}): {
  chains: UniverseChainId[]
  gqlChains: InterfaceGqlChain[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
} {
  if (isTestnetModeEnabled) {
    const supportedTestnetChainIds = SUPPORTED_TESTNET_CHAIN_IDS.filter(
      (chainId) =>
        featureFlaggedChainIds.includes(chainId) &&
        (connectedWalletChainIds ? connectedWalletChainIds.includes(chainId) : true),
    )

    return {
      chains: supportedTestnetChainIds,
      gqlChains: GQL_TESTNET_CHAINS_MUTABLE,
      defaultChainId: UniverseChainId.Sepolia as UniverseChainId,
      isTestnetModeEnabled,
    }
  }

  const supportedChainIds = SUPPORTED_CHAIN_IDS.filter(
    (chainId) =>
      featureFlaggedChainIds.includes(chainId) &&
      (connectedWalletChainIds ? connectedWalletChainIds.includes(chainId) : true),
  )

  const supportedGqlChains = GQL_MAINNET_CHAINS_MUTABLE.filter((chain) => {
    const chainId = fromGraphQLChain(chain)
    return chainId && supportedChainIds.includes(chainId)
  })

  return {
    chains: supportedChainIds,
    gqlChains: supportedGqlChains,
    defaultChainId: UniverseChainId.Mainnet as UniverseChainId,
    isTestnetModeEnabled,
  }
}
