import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { CONNECTION } from 'components/Web3Provider/constants'
import { useAccount } from 'hooks/useAccount'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useUniswapWalletOptions() {
  const isGALive = useFeatureFlag(FeatureFlags.ExtensionLaunch)

  const isExtensionInstalled = Boolean(useConnectorWithId(CONNECTION.UNISWAP_EXTENSION_RDNS))

  return isExtensionInstalled || isGALive
}

/**
 * Checks if the `extension_launch` feature flag is enabled and if the user is not connected a different wallet.
 *
 * This hook returns `true` under the following conditions:
 * - The `extension_launch` feature flag is set to `true`.
 * - The user has not connected to a different wallet
 *
 * @returns {boolean} True if the extension launch feature is enabled and the user is not connected a different wallet; otherwise, false.
 */
export function useIsUniExtensionAvailable() {
  const isGALive = useFeatureFlag(FeatureFlags.ExtensionLaunch)
  const currentConnector = useAccount().connector
  const currentConnectIsNotUniExtension = currentConnector && currentConnector.id !== CONNECTION.UNISWAP_EXTENSION_RDNS

  return isGALive && !currentConnectIsNotUniExtension
}
