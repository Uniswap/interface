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
import { isInterface } from 'utilities/src/platform'

export function useHideSmallBalancesSetting(): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()

  return useSelector(selectWalletHideSmallBalancesSetting) && !isTestnetModeEnabled
}

export function useHideSpamTokensSetting(): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()

  return useSelector(selectWalletHideSpamTokensSetting) && !isTestnetModeEnabled
}

// Returns the chain ids supported by the user's connected wallet
function useConnectedWalletSupportedChains(): UniverseChainId[] {
  try {
    const connector = useConnector()

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
  } catch (_e) {
    if (isInterface && !isTestEnv()) {
      logger.error(_e, {
        tags: { file: 'src/features/settings/hooks', function: 'useConnectedWalletSupportedChains' },
      })
    }
    // We're outside the UniswapContext when this hook is used by wallet or extension, so return all chains
    return COMBINED_CHAIN_IDS
  }
}

export function useEnabledChains(): {
  chains: UniverseChainId[]
  gqlChains: InterfaceGqlChain[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
} {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const connectedWalletChainIds = useConnectedWalletSupportedChains()
  const isTestnetModeFromState = useSelector(selectIsTestnetModeEnabled)
  const isTestnetModeFromFlag = useFeatureFlag(FeatureFlags.TestnetMode)
  const isTestnetModeEnabled = isTestnetModeFromState && isTestnetModeFromFlag

  return useMemo(
    () => getEnabledChains({ isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds }),
    [isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds],
  )
}
