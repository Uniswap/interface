import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  GQL_MAINNET_CHAINS,
  GQL_TESTNET_CHAINS,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  UNIVERSE_CHAIN_INFO,
  getChainInfo,
} from 'uniswap/src/features/chains/chainInfo'
import {
  ALL_CHAIN_IDS,
  EnabledChainsInfo,
  GqlChainId,
  NetworkLayer,
  SUPPORTED_CHAIN_IDS,
  SUPPORTED_TESTNET_CHAIN_IDS,
  UniverseChainId,
} from 'uniswap/src/features/chains/types'

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish): UniverseChainId | null {
  if (!chainId || !ALL_CHAIN_IDS.map((c) => c.toString()).includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as UniverseChainId
}

export function chainSupportsGasEstimates(chainId: UniverseChainId): boolean {
  return getChainInfo(chainId).supportsGasEstimates
}

export function getChainLabel(chainId: UniverseChainId): string {
  return getChainInfo(chainId).label
}

export function isTestnetChain(chainId: UniverseChainId): boolean {
  return Boolean(getChainInfo(chainId)?.testnet)
}

export function getChainIdByInfuraPrefix(prefix: string): UniverseChainId | undefined {
  return Object.values(UNIVERSE_CHAIN_INFO).find((i) => i.infuraPrefix === prefix)?.id
}

export function isBackendSupportedChainId(chainId: UniverseChainId): boolean {
  const info = getChainInfo(chainId)
  return info.backendChain.backendSupported && !info.backendChain.isSecondaryChain
}

export function isBackendSupportedChain(chain: Chain): chain is GqlChainId {
  const chainId = fromGraphQLChain(chain)
  if (!chainId) {
    return false
  }

  return chainId && isBackendSupportedChainId(chainId)
}

export function chainIdToHexadecimalString(chainId: UniverseChainId): string {
  return BigNumber.from(chainId).toHexString()
}

export function hexadecimalStringToInt(hex: string): number {
  return parseInt(hex, 16)
}

export function isL2ChainId(chainId?: UniverseChainId): boolean {
  return chainId !== undefined && getChainInfo(chainId).networkLayer === NetworkLayer.L2
}

export function isMainnetChainId(chainId?: UniverseChainId): boolean {
  return chainId === UniverseChainId.Mainnet
}

export function toGraphQLChain(chainId: UniverseChainId): GqlChainId {
  return getChainInfo(chainId).backendChain.chain
}

export function fromGraphQLChain(chain: Chain | string | undefined): UniverseChainId | null {
  switch (chain) {
    case Chain.Ethereum:
      return UniverseChainId.Mainnet
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
    default:
      throw new Error(`Network "${network}" can not be mapped`)
  }
}

export function toUniswapWebAppLink(chainId: UniverseChainId): string | null {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return Chain.Ethereum.toLowerCase()
    default:
      throw new Error(`ChainID "${chainId}" can not be mapped`)
  }
}

export function filterChainIdsByFeatureFlag(featureFlaggedChainIds: {
  [key in UniverseChainId]?: boolean
}): UniverseChainId[] {
  return ALL_CHAIN_IDS.filter((chainId) => {
    return featureFlaggedChainIds[chainId] ?? true
  })
}

export function getEnabledChains({
  isTestnetModeEnabled,
  featureFlaggedChainIds,
  connectedWalletChainIds,
}: {
  isTestnetModeEnabled: boolean
  featureFlaggedChainIds: UniverseChainId[]
  connectedWalletChainIds?: UniverseChainId[]
}): EnabledChainsInfo {
  if (isTestnetModeEnabled) {
    const supportedTestnetChainIds = SUPPORTED_TESTNET_CHAIN_IDS.filter(
      (chainId) =>
        featureFlaggedChainIds.includes(chainId) &&
        (connectedWalletChainIds ? connectedWalletChainIds.includes(chainId) : true),
    )

    return {
      chains: supportedTestnetChainIds,
      gqlChains: GQL_TESTNET_CHAINS,
      defaultChainId: UniverseChainId.SmartBCH as UniverseChainId,
      isTestnetModeEnabled,
    }
  }

  const supportedChainIds = SUPPORTED_CHAIN_IDS.filter(
    (chainId) =>
      featureFlaggedChainIds.includes(chainId) &&
      (connectedWalletChainIds ? connectedWalletChainIds.includes(chainId) : true),
  )

  const supportedGqlChains = GQL_MAINNET_CHAINS.filter((chain) => {
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
