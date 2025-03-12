import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useConnector } from 'uniswap/src/contexts/UniswapContext'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { useOrderedChainIds } from 'uniswap/src/features/chains/hooks/useOrderedChainIds'
import { ALL_CHAIN_IDS, EnabledChainsInfo, GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEnabledChains } from 'uniswap/src/features/chains/utils'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { WalletConnectConnector } from 'uniswap/src/features/web3/walletConnect'
import { isTestEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'
import { Connector } from 'wagmi'

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

// Returns the chain ids supported by the connector
function useConnectorSupportedChains(connector?: Connector): UniverseChainId[] {
  // We need to memoize the connected wallet chain ids to avoid infinite loops
  // caused by modifying the gqlChains returned by useEnabledChains
  return useMemo(() => {
    switch (connector?.type) {
      case CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
      case CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID:
        // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
        return (connector as WalletConnectConnector).getNamespaceChainsIds?.().length
          ? (connector as WalletConnectConnector).getNamespaceChainsIds?.()
          : ALL_CHAIN_IDS
      default:
        return ALL_CHAIN_IDS
    }
  }, [connector])
}

// Returns the chain ids supported by the user's connected wallet
function useConnectedWalletSupportedChains(): UniverseChainId[] {
  const connector = useConnectorWithCatch()
  return useConnectorSupportedChains(connector)
}

export function useEnabledChains(): EnabledChainsInfo {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const connectedWalletChainIds = useConnectedWalletSupportedChains()
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)

  const {
    chains: unorderedChains,
    gqlChains,
    defaultChainId,
  } = useMemo(
    () =>
      getEnabledChains({
        isTestnetModeEnabled,
        connectedWalletChainIds,
        featureFlaggedChainIds,
      }),
    [isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds],
  )

  const orderedChains = useOrderedChainIds(unorderedChains)

  return useMemo(() => {
    return { chains: orderedChains, gqlChains, defaultChainId, isTestnetModeEnabled }
  }, [defaultChainId, gqlChains, isTestnetModeEnabled, orderedChains])
}

export function useEnabledChainsWithConnector(connector?: Connector): {
  chains: UniverseChainId[]
  gqlChains: GqlChainId[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
} {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const connectedWalletChainIds = useConnectorSupportedChains(connector)
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)

  return useMemo(
    () => getEnabledChains({ isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds }),
    [isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds],
  )
}
