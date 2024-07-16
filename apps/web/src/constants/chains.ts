/* eslint-disable rulesdir/no-undefined-or */
import { Currency, V2_ROUTER_ADDRESSES } from '@uniswap/sdk-core'
import ms from 'ms'
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, UniverseChainId, UniverseChainInfo, WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'

export const AVERAGE_L1_BLOCK_TIME = ms(`12s`)

export function isSupportedChainId(chainId?: number | InterfaceChainId | null): chainId is SupportedInterfaceChainId {
  return !!chainId && WEB_SUPPORTED_CHAIN_IDS.includes(chainId as SupportedInterfaceChainId)
}

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
// This is the reason why useSupportedChainId and useIsSupportedChainId is a hook instead of a function.
function useFeatureFlaggedChainIds(): Partial<Record<SupportedInterfaceChainId, boolean>> {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)

  const zoraEnabled = useFeatureFlag(FeatureFlags.Zora)
  return useMemo(
    () => ({
      [UniverseChainId.Zora]: zoraEnabled,
    }),
    [zoraEnabled],
  )
}

export function useIsSupportedChainId(chainId?: number | InterfaceChainId): chainId is SupportedInterfaceChainId {
  const featureFlaggedChains = useFeatureFlaggedChainIds()

  const chainIsNotEnabled = featureFlaggedChains[chainId as SupportedInterfaceChainId] === false
  return chainIsNotEnabled ? false : isSupportedChainId(chainId)
}

export function useIsSupportedChainIdCallback() {
  const featureFlaggedChains = useFeatureFlaggedChainIds()

  return useCallback(
    (chainId?: number | InterfaceChainId): chainId is SupportedInterfaceChainId => {
      const chainIsNotEnabled = featureFlaggedChains[chainId as SupportedInterfaceChainId] === false
      return chainIsNotEnabled ? false : isSupportedChainId(chainId)
    },
    [featureFlaggedChains],
  )
}

export function useSupportedChainId(chainId?: number): SupportedInterfaceChainId | undefined {
  const featureFlaggedChains = useFeatureFlaggedChainIds()
  if (!chainId || WEB_SUPPORTED_CHAIN_IDS.indexOf(chainId) === -1) {
    return
  }

  const chainDisabled = featureFlaggedChains[chainId as SupportedInterfaceChainId] === false
  return chainDisabled ? undefined : (chainId as SupportedInterfaceChainId)
}

export type InterfaceGqlChain = Exclude<BackendChainId, BackendChainId.UnknownChain>

export type SupportedInterfaceChainId = InterfaceChainId

export type ChainSlug = UniverseChainInfo['urlParam']
export const isChainUrlParam = (str?: string): str is ChainSlug =>
  !!str && Object.values(UNIVERSE_CHAIN_INFO).some((chain) => chain.urlParam === str)
export const getChainUrlParam = (str?: string): ChainSlug | undefined => (isChainUrlParam(str) ? str : undefined)

export function getChain(options: { chainId: SupportedInterfaceChainId }): UniverseChainInfo
export function getChain(options: { chainId?: SupportedInterfaceChainId; withFallback: true }): UniverseChainInfo
export function getChain(options: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): UniverseChainInfo | undefined
export function getChain({
  chainId,
  withFallback,
}: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): UniverseChainInfo | undefined {
  return chainId
    ? UNIVERSE_CHAIN_INFO[chainId]
    : withFallback
      ? UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet]
      : undefined
}

export const CHAIN_IDS_TO_NAMES = Object.fromEntries(
  Object.entries(UNIVERSE_CHAIN_INFO).map(([key, value]) => [key, value.interfaceName]),
) as { [chainId in SupportedInterfaceChainId]: string }

export const GQL_MAINNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => !chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)
  .filter((backendChain) => !!backendChain)

const GQL_TESTNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)

export const UX_SUPPORTED_GQL_CHAINS = [...GQL_MAINNET_CHAINS, ...GQL_TESTNET_CHAINS]

export const CHAIN_ID_TO_BACKEND_NAME = Object.fromEntries(
  Object.entries(UNIVERSE_CHAIN_INFO).map(([key, value]) => [key, value.backendChain.chain]),
) as { [chainId in SupportedInterfaceChainId]: InterfaceGqlChain }

export function chainIdToBackendChain(options: { chainId: UniverseChainId }): InterfaceGqlChain
export function chainIdToBackendChain(options: { chainId?: UniverseChainId; withFallback: true }): InterfaceGqlChain
export function chainIdToBackendChain(options: {
  chainId?: UniverseChainId
  withFallback?: boolean
}): InterfaceGqlChain | undefined
export function chainIdToBackendChain({
  chainId,
  withFallback,
}: {
  chainId?: UniverseChainId
  withFallback?: boolean
}): InterfaceGqlChain | undefined {
  return chainId
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : withFallback
      ? CHAIN_ID_TO_BACKEND_NAME[UniverseChainId.Mainnet]
      : undefined
}

export const CHAIN_NAME_TO_CHAIN_ID = Object.fromEntries(
  Object.entries(UNIVERSE_CHAIN_INFO)
    .filter(([, value]) => !value.backendChain.isSecondaryChain)
    .map(([key, value]) => [value.backendChain.chain, parseInt(key) as SupportedInterfaceChainId]),
) as { [chain in InterfaceGqlChain]: SupportedInterfaceChainId }

export const ALL_CHAIN_IDS: UniverseChainId[] = Object.values(UNIVERSE_CHAIN_INFO).map((chain) => chain.id)

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = Object.keys(UNIVERSE_CHAIN_INFO)
  .filter((key) => UNIVERSE_CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].supportsGasEstimates)
  .map((key) => parseInt(key) as SupportedInterfaceChainId)

export const PRODUCTION_CHAIN_IDS: UniverseChainId[] = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => !chain.testnet)
  .map((chain) => chain.id)

export const TESTNET_CHAIN_IDS = Object.keys(UNIVERSE_CHAIN_INFO)
  .filter((key) => UNIVERSE_CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].testnet)
  .map((key) => parseInt(key) as SupportedInterfaceChainId)

/**
 * @deprecated when v2 pools are enabled on chains supported through sdk-core
 */
export const SUPPORTED_V2POOL_CHAIN_IDS = Object.keys(V2_ROUTER_ADDRESSES).map((chainId) => parseInt(chainId))

export const BACKEND_SUPPORTED_CHAINS = Object.keys(UNIVERSE_CHAIN_INFO)
  .filter((key) => {
    const chainId = parseInt(key) as SupportedInterfaceChainId
    return (
      UNIVERSE_CHAIN_INFO[chainId].backendChain.backendSupported &&
      !UNIVERSE_CHAIN_INFO[chainId].backendChain.isSecondaryChain &&
      !UNIVERSE_CHAIN_INFO[chainId].testnet
    )
  })
  .map((key) => UNIVERSE_CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].backendChain.chain as InterfaceGqlChain)

export const BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS = GQL_MAINNET_CHAINS.filter(
  (chain) => !BACKEND_SUPPORTED_CHAINS.includes(chain),
).map((chain) => CHAIN_NAME_TO_CHAIN_ID[chain]) as [SupportedInterfaceChainId]

export const INFURA_PREFIX_TO_CHAIN_ID: { [prefix: string]: SupportedInterfaceChainId } = Object.fromEntries(
  Object.entries(UNIVERSE_CHAIN_INFO)
    .filter(([, value]) => !!value.infuraPrefix)
    .map(([key, value]) => [value.infuraPrefix, parseInt(key) as SupportedInterfaceChainId]),
)

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: InterfaceChainId): number {
  if (isSupportedChainId(chainId)) {
    return UNIVERSE_CHAIN_INFO[chainId].chainPriority
  }

  return Infinity
}

export function isUniswapXSupportedChain(chainId?: number) {
  return chainId === UniverseChainId.Mainnet
}

export function isStablecoin(currency?: Currency): boolean {
  if (!currency) {
    return false
  }

  return getChain({ chainId: currency.chainId as SupportedInterfaceChainId }).stablecoins.some((stablecoin) =>
    stablecoin.equals(currency),
  )
}

export function getChainFromChainUrlParam(chainUrlParam?: ChainSlug): UniverseChainInfo | undefined {
  return chainUrlParam !== undefined
    ? Object.values(UNIVERSE_CHAIN_INFO).find((chain) => chainUrlParam === chain.urlParam)
    : undefined
}

export function useChainFromUrlParam(): UniverseChainInfo | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab
  return getChainFromChainUrlParam(getChainUrlParam(chainName ?? tab))
}
