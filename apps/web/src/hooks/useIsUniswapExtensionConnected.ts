import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAccount } from 'hooks/useAccount'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

// Checks if the user is connected to the uniswap extension.
//
// @returns {boolean} True if the user is connected to the uniswap extension; otherwise, false.
//
export function useIsUniswapExtensionConnected() {
  const isExtensionDeeplinkingDisabled = useFeatureFlag(FeatureFlags.DisableExtensionDeeplinks)
  const currentConnector = useAccount().connector

  return !isExtensionDeeplinkingDisabled && currentConnector?.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS
}
