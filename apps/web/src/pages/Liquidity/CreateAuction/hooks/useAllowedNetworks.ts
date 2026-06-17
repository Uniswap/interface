import { CreateAuctionConfigKey, DynamicConfigs, useDynamicConfigValue } from '@universe/gating'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { isUniverseChainIdArrayType } from 'uniswap/src/features/gating/typeGuards'

// The auction flow has two independently-configurable network lists, backed by two Statsig keys:
//   - AllowedTokenCreationNetworks: chains a brand-new token can be deployed + auctioned on.
//   - AllowedNetworks: chains an existing token can be auctioned on.
// They intentionally differ (e.g. an existing token can be auctioned on Arbitrum, but new-token
// creation isn't offered there), so each keeps its own default below.
const DEFAULT_TOKEN_CREATION_NETWORKS = [
  UniverseChainId.Mainnet,
  UniverseChainId.Unichain,
  UniverseChainId.Base,
  UniverseChainId.Sepolia,
]

const DEFAULT_AUCTION_NETWORKS = [
  UniverseChainId.Mainnet,
  UniverseChainId.Unichain,
  UniverseChainId.Base,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Sepolia,
]

const VALID_CHAIN_IDS = new Set<UniverseChainId>(
  Object.values(UniverseChainId).filter((value): value is UniverseChainId => typeof value === 'number'),
)

/**
 * Filters a list of allowed network ids down to those that match the current testnet mode: only
 * testnet chains when testnet mode is enabled, only mainnet chains otherwise. Ids that aren't valid
 * UniverseChainIds are dropped. Mirrors the testnet partitioning that `getEnabledChains` applies to
 * the globally enabled chains, so the auction network pickers stay consistent with the rest of the app.
 */
export function filterAllowedNetworksByTestnetMode({
  allowedNetworkIds,
  isTestnetModeEnabled,
}: {
  allowedNetworkIds: UniverseChainId[]
  isTestnetModeEnabled: boolean
}): UniverseChainId[] {
  return allowedNetworkIds.filter(
    (id): id is UniverseChainId => VALID_CHAIN_IDS.has(id) && isTestnetChain(id) === isTestnetModeEnabled,
  )
}

function useAllowedNetworks({
  configKey,
  defaultValue,
}: {
  configKey: CreateAuctionConfigKey
  defaultValue: UniverseChainId[]
}): UniverseChainId[] {
  const { isTestnetModeEnabled } = useEnabledChains()
  const allowedNetworkIds = useDynamicConfigValue<
    DynamicConfigs.CreateAuction,
    CreateAuctionConfigKey,
    UniverseChainId[]
  >({
    config: DynamicConfigs.CreateAuction,
    key: configKey,
    defaultValue,
    customTypeGuard: isUniverseChainIdArrayType,
  })

  return useMemo(
    () => filterAllowedNetworksByTestnetMode({ allowedNetworkIds, isTestnetModeEnabled }),
    [allowedNetworkIds, isTestnetModeEnabled],
  )
}

/** Networks available when creating a brand-new token to auction. */
export function useCreateNewTokenAllowedNetworks(): UniverseChainId[] {
  return useAllowedNetworks({
    configKey: CreateAuctionConfigKey.AllowedTokenCreationNetworks,
    defaultValue: DEFAULT_TOKEN_CREATION_NETWORKS,
  })
}

/** Networks available when auctioning an existing token. */
export function useCreateAuctionAllowedNetworks(): UniverseChainId[] {
  return useAllowedNetworks({
    configKey: CreateAuctionConfigKey.AllowedNetworks,
    defaultValue: DEFAULT_AUCTION_NETWORKS,
  })
}
