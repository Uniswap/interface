import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useConnector } from 'uniswap/src/contexts/UniswapContext'
import { getEnabledChains, useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import {
  selectIsTestnetModeEnabled,
  selectWalletHideSmallBalancesSetting,
  selectWalletHideSpamTokensSetting,
} from 'uniswap/src/features/settings/selectors'
import { WalletConnectConnector } from 'uniswap/src/features/web3/walletConnect'
import { COMBINED_CHAIN_IDS, InterfaceGqlChain, UniverseChainId } from 'uniswap/src/types/chains'
import { isTestEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { isInterface, isMobileApp } from 'utilities/src/platform'
import { Connector } from 'wagmi'

export const TESTNET_MODE_BANNER_HEIGHT = 44

export function useHideSmallBalancesSetting(): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()

  return useSelector(selectWalletHideSmallBalancesSetting) && !isTestnetModeEnabled
}

export function useHideSpamTokensSetting(): boolean {
  return useSelector(selectWalletHideSpamTokensSetting)
}

// Note: only use this hook for useConnectedWalletSupportedChains
// for wallet we expect useConnector to throw because there is no connector
function useConnectorWithCatch(): Connector | undefined {
  try {
    return useConnector()
  } catch (_e) {
    if (isInterface && !isTestEnv()) {
      logger.error(_e, {
        tags: { file: 'src/features/settings/hooks', function: 'useConnectorWithCatch' },
      })
    }
    return undefined
  }
}

// Returns the chain ids supported by the user's connected wallet
function useConnectedWalletSupportedChains(): UniverseChainId[] {
  const connector = useConnectorWithCatch()
  // We need to memoize the connected wallet chain ids to avoid infinite loops
  // caused by modifying the gqlChains returned by useEnabledChains
  return useMemo(() => {
    switch (connector?.type) {
      case CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
      case CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID:
        // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
        return (connector as WalletConnectConnector).getNamespaceChainsIds?.().length
          ? (connector as WalletConnectConnector).getNamespaceChainsIds?.()
          : COMBINED_CHAIN_IDS
      default:
        return COMBINED_CHAIN_IDS
    }
  }, [connector])
}

function useIsTestnetModeEnabled(): boolean {
  const isTestnetModeFromState = useSelector(selectIsTestnetModeEnabled)
  const isTestnetModeFromFlag = useFeatureFlag(FeatureFlags.TestnetMode)
  return isTestnetModeFromState && isTestnetModeFromFlag
}

export function useEnabledChains(): {
  chains: UniverseChainId[]
  gqlChains: InterfaceGqlChain[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
} {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const connectedWalletChainIds = useConnectedWalletSupportedChains()
  const isTestnetModeEnabled = useIsTestnetModeEnabled()

  return useMemo(
    () => getEnabledChains({ isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds }),
    [isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds],
  )
}

/**
 * Use to account for an inset when `useAppInsets()` is not available
 *
 * @returns The height of the testnet mode banner if testnet mode is enabled, otherwise 0
 */
export function useTestnetModeBannerHeight(): number {
  const isTestnetModeEnabled = useIsTestnetModeEnabled()

  return isTestnetModeEnabled && isMobileApp ? TESTNET_MODE_BANNER_HEIGHT : 0
}
