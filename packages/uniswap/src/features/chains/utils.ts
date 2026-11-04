import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { areEvmAddressesEqual, isSVMChain, Platform, UniverseChainId } from '@universe/chains'
import { AppId, getConfig } from '@universe/config'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ALL_CHAIN_IDS, getChainInfo, ORDERED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/defaults'
import { DEFAULT_NATIVE_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { EnabledChainsInfo, NetworkLayer } from 'uniswap/src/features/chains/types'
// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish): UniverseChainId | null {
  if (!chainId || !ALL_CHAIN_IDS.map((c) => c.toString()).includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as UniverseChainId
}

/**
 * Like `toSupportedChainId`, but also accepts the hex strings dapps send. Fails closed on
 * anything unparseable.
 */
export function toSupportedDappChainId(chainId?: BigNumberish | null): UniverseChainId | null {
  if (chainId === undefined || chainId === null) {
    return null
  }

  const asNumber = Number(chainId.toString())
  if (!Number.isFinite(asNumber)) {
    return null
  }

  return toSupportedChainId(asNumber)
}

export function getChainLabel(chainId: UniverseChainId): string {
  return getChainInfo(chainId).label
}

/**
 * Return the explorer name for the given chain ID
 * @param chainId the ID of the chain for which to return the explorer name
 */
export function getChainExplorerName(chainId: UniverseChainId): string {
  return getChainInfo(chainId).explorer.name
}

export function isTestnetChain(chainId: UniverseChainId): boolean {
  return Boolean(getChainInfo(chainId).testnet)
}

export function isBackendSupportedChainId(chainId: UniverseChainId): boolean {
  const info = getChainInfo(chainId)
  return info.backendChain.backendSupported
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

export function getPollingIntervalByBlocktime(chainId?: UniverseChainId): PollingInterval {
  return isMainnetChainId(chainId) ? PollingInterval.Fast : PollingInterval.LightningMcQueen
}

export function fromUniswapWebAppLink(network: string | null): UniverseChainId {
  // Unichain Sepolia's slug before it was renamed; older links still carry it.
  if (network === 'astrochain_sepolia') {
    return UniverseChainId.UnichainSepolia
  }

  const chainId = ALL_CHAIN_IDS.find((id) => getChainInfo(id).urlParam === network)
  if (chainId === undefined) {
    throw new Error(`Network "${network}" can not be mapped`)
  }
  return chainId
}

export function toUniswapWebAppLink(chainId: UniverseChainId): string {
  return getChainInfo(chainId).urlParam
}

export function filterChainIdsByFeatureFlag(featureFlaggedChainIds: {
  [key in UniverseChainId]?: boolean
}): UniverseChainId[] {
  return ALL_CHAIN_IDS.filter((chainId) => {
    return featureFlaggedChainIds[chainId] ?? true
  })
}

export function isChainSupportedOnApp(chainId: UniverseChainId, appId: AppId): boolean {
  return getChainInfo(chainId).supportedApps.includes(appId)
}

export function filterChainIdsByAppSupport(chainIds: UniverseChainId[], appId: AppId): UniverseChainId[] {
  return chainIds.filter((chainId) => isChainSupportedOnApp(chainId, appId))
}

/**
 * Filters chain IDs by platform (EVM or SVM)
 * @param chainIds Array of chain IDs to filter (as numbers)
 * @param platform Platform to filter by (EVM or SVM)
 * @returns Filtered array of chain IDs matching the specified platform
 */
export function filterChainIdsByPlatform<T extends number>(chainIds: T[], platform: Platform): T[] {
  return chainIds.filter<T>((chainId): chainId is T => {
    const universeChainId = chainId as UniverseChainId
    if (!ALL_CHAIN_IDS.includes(universeChainId)) {
      return false
    }
    const chainInfo = getChainInfo(universeChainId)
    return chainInfo.platform === platform
  })
}

export function getEnabledChains({
  platform,
  /**
   * When `true`, it will return all enabled chains, including testnets.
   */
  includeTestnets = false,
  isTestnetModeEnabled,
  featureFlaggedChainIds,
  appId = getConfig().appId,
}: {
  platform?: Platform
  isTestnetModeEnabled: boolean
  featureFlaggedChainIds: UniverseChainId[]
  includeTestnets?: boolean
  /** Override for tests; defaults to the running app's AppId. */
  appId?: AppId
}): EnabledChainsInfo {
  const enabledChainInfos = ORDERED_CHAINS.filter((chainInfo) => {
    // Filter by app support (structural — not a feature flag concern)
    if (!chainInfo.supportedApps.includes(appId)) {
      return false
    }

    // Filter by platform
    if (platform !== undefined && platform !== chainInfo.platform) {
      return false
    }

    // Filter by testnet mode
    if (!includeTestnets && isTestnetModeEnabled !== isTestnetChain(chainInfo.id)) {
      return false
    }

    // Filter by feature flags
    if (!featureFlaggedChainIds.includes(chainInfo.id)) {
      return false
    }

    return true
  })

  const chains = enabledChainInfos.map((chainInfo) => chainInfo.id)

  const result = {
    chains,
    defaultChainId: getDefaultChainId({ platform, isTestnetModeEnabled }),
    isTestnetModeEnabled,
  }

  return result
}

function getDefaultChainId({
  platform,
  isTestnetModeEnabled,
}: {
  platform?: Platform
  isTestnetModeEnabled: boolean
}): UniverseChainId {
  if (platform === Platform.SVM) {
    // TODO(Solana): is there a Solana testnet we can return here?
    return UniverseChainId.Solana
  }

  return isTestnetModeEnabled ? UniverseChainId.Sepolia : UniverseChainId.Mainnet
}

/** Platform-wide native sentinel the data API accepts for any chain: zero address on EVM, system program on SVM. */
export function getDefaultNativeAddress(chainId: UniverseChainId): string {
  return isSVMChain(chainId) ? DEFAULT_NATIVE_ADDRESS_SOLANA : DEFAULT_NATIVE_ADDRESS
}

/** Returns all stablecoins for a given chainId. */
export function getStablecoinsForChain(chainId: UniverseChainId): Token[] {
  return getChainInfo(chainId).tokens.stablecoins
}

/** Checks if a token address is a stablecoin on the given chain. */
export function isStablecoinAddress(chainId: UniverseChainId, tokenAddress: string): boolean {
  try {
    const stablecoins = getStablecoinsForChain(chainId)
    return stablecoins.some((stablecoin) => areEvmAddressesEqual(stablecoin.address, tokenAddress))
  } catch {
    return false
  }
}

/** Returns the primary stablecoin for a given chainId. */
export function getPrimaryStablecoin(chainId: UniverseChainId): Token {
  return getChainInfo(chainId).tokens.stablecoins[0]
}

export function isUniverseChainId(chainId?: number | UniverseChainId | null): chainId is UniverseChainId {
  return !!chainId && ALL_CHAIN_IDS.includes(chainId as UniverseChainId)
}
