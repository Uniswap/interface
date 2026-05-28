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
  return chainId === UniverseChainId.Mainnet || chainId === UniverseChainId.Sepolia
}

export function toGraphQLChain(chainId: UniverseChainId): GqlChainId {
  return getChainInfo(chainId).backendChain.chain
}

const GRAPHQL_CHAIN_TO_UNIVERSE: Record<string, UniverseChainId> = {
  [Chain.Ethereum]: UniverseChainId.Mainnet,
  [Chain.Arbitrum]: UniverseChainId.ArbitrumOne,
  [Chain.Avalanche]: UniverseChainId.Avalanche,
  [Chain.Base]: UniverseChainId.Base,
  [Chain.Bnb]: UniverseChainId.Bnb,
  [Chain.Blast]: UniverseChainId.Blast,
  [Chain.Celo]: UniverseChainId.Celo,
  [Chain.Hyper]: UniverseChainId.HyperMainnet,
  [Chain.MonadTestnet]: UniverseChainId.MonadTestnet,
  [Chain.Optimism]: UniverseChainId.Optimism,
  [Chain.Polygon]: UniverseChainId.Polygon,
  [Chain.EthereumSepolia]: UniverseChainId.Sepolia,
  [Chain.Unichain]: UniverseChainId.Unichain,
  [Chain.Soneium]: UniverseChainId.Soneium,
  [Chain.AstrochainSepolia]: UniverseChainId.UnichainSepolia,
  [Chain.Worldchain]: UniverseChainId.WorldChain,
  [Chain.Zksync]: UniverseChainId.Zksync,
  [Chain.Zora]: UniverseChainId.Zora,
  [Chain.Xlayer]: UniverseChainId.XLayer,
  [Chain.Megaeth]: UniverseChainId.MEGAETHMainnet,
}

export function fromGraphQLChain(chain: Chain | string | undefined): UniverseChainId | null {
  return chain != null ? GRAPHQL_CHAIN_TO_UNIVERSE[chain] ?? null : null
}

export function getPollingIntervalByBlocktime(chainId?: UniverseChainId): PollingInterval {
  return isMainnetChainId(chainId) ? PollingInterval.Fast : PollingInterval.LightningMcQueen
}

const WEBAPP_LINK_TO_UNIVERSE: Record<string, UniverseChainId> = {
  [Chain.Ethereum.toLowerCase()]: UniverseChainId.Mainnet,
  [Chain.Arbitrum.toLowerCase()]: UniverseChainId.ArbitrumOne,
  [Chain.Avalanche.toLowerCase()]: UniverseChainId.Avalanche,
  [Chain.Base.toLowerCase()]: UniverseChainId.Base,
  [Chain.Blast.toLowerCase()]: UniverseChainId.Blast,
  [Chain.Bnb.toLowerCase()]: UniverseChainId.Bnb,
  [Chain.Celo.toLowerCase()]: UniverseChainId.Celo,
  [Chain.MonadTestnet.toLowerCase()]: UniverseChainId.MonadTestnet,
  [Chain.Optimism.toLowerCase()]: UniverseChainId.Optimism,
  [Chain.Polygon.toLowerCase()]: UniverseChainId.Polygon,
  [Chain.EthereumSepolia.toLowerCase()]: UniverseChainId.Sepolia,
  [Chain.Unichain.toLowerCase()]: UniverseChainId.Unichain,
  [Chain.Soneium.toLowerCase()]: UniverseChainId.Soneium,
  [Chain.AstrochainSepolia.toLowerCase()]: UniverseChainId.UnichainSepolia,
  [Chain.Worldchain.toLowerCase()]: UniverseChainId.WorldChain,
  [Chain.Zksync.toLowerCase()]: UniverseChainId.Zksync,
  [Chain.Zora.toLowerCase()]: UniverseChainId.Zora,
  [Chain.Xlayer.toLowerCase()]: UniverseChainId.XLayer,
  [Chain.Megaeth.toLowerCase()]: UniverseChainId.MEGAETHMainnet,
  [Chain.Hyper.toLowerCase()]: UniverseChainId.HyperMainnet,
}

export function fromUniswapWebAppLink(network: string | null): UniverseChainId | null {
  const chainId = network != null ? WEBAPP_LINK_TO_UNIVERSE[network] : undefined
  if (chainId === undefined) {
    throw new Error(`Network "${network}" can not be mapped`)
  }
  return chainId
}

const UNIVERSE_TO_WEBAPP_LINK: Record<UniverseChainId, string> = {
  [UniverseChainId.Mainnet]: Chain.Ethereum.toLowerCase(),
  [UniverseChainId.ArbitrumOne]: Chain.Arbitrum.toLowerCase(),
  [UniverseChainId.Avalanche]: Chain.Avalanche.toLowerCase(),
  [UniverseChainId.Base]: Chain.Base.toLowerCase(),
  [UniverseChainId.Blast]: Chain.Blast.toLowerCase(),
  [UniverseChainId.Bnb]: Chain.Bnb.toLowerCase(),
  [UniverseChainId.Celo]: Chain.Celo.toLowerCase(),
  [UniverseChainId.MonadTestnet]: Chain.MonadTestnet.toLowerCase(),
  [UniverseChainId.Optimism]: Chain.Optimism.toLowerCase(),
  [UniverseChainId.Polygon]: Chain.Polygon.toLowerCase(),
  [UniverseChainId.Sepolia]: Chain.EthereumSepolia.toLowerCase(),
  [UniverseChainId.Unichain]: Chain.Unichain.toLowerCase(),
  [UniverseChainId.Soneium]: Chain.Soneium.toLowerCase(),
  [UniverseChainId.UnichainSepolia]: Chain.AstrochainSepolia.toLowerCase(),
  [UniverseChainId.WorldChain]: Chain.Worldchain.toLowerCase(),
  [UniverseChainId.Zksync]: Chain.Zksync.toLowerCase(),
  [UniverseChainId.Zora]: Chain.Zora.toLowerCase(),
  [UniverseChainId.XLayer]: Chain.Xlayer.toLowerCase(),
  [UniverseChainId.MEGAETHMainnet]: Chain.Megaeth.toLowerCase(),
  [UniverseChainId.HyperMainnet]: Chain.Hyper.toLowerCase(),
}

export function toUniswapWebAppLink(chainId: UniverseChainId): string | null {
  const link = UNIVERSE_TO_WEBAPP_LINK[chainId]
  if (link === undefined) {
    throw new Error(`ChainID "${chainId}" can not be mapped`)
  }
  return link
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
      defaultChainId: UniverseChainId.Sepolia as UniverseChainId,
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
