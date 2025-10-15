import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useConnector } from 'uniswap/src/contexts/UniswapContext'
import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
// This is the only file that should be importing `useOrderedChainIds` directly.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useOrderedChainIds } from 'uniswap/src/features/chains/hooks/useOrderedChainIds'
import { EnabledChainsInfo, GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEnabledChains, isTestnetChain } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
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
  } catch (e) {
    if (isInterface && !isTestEnv()) {
      logger.error(e, {
        tags: { file: 'src/features/settings/hooks', function: 'useConnectorWithCatch' },
      })
    }
    return undefined
  }
}

// Returns the chain ids supported by the connector
function getConnectorSupportedChains(connector?: Connector): UniverseChainId[] {
  // We need to memoize the connected wallet chain ids to avoid infinite loops
  // caused by modifying the gqlChains returned by useEnabledChains

  switch (connector?.type) {
    case CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
    case CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID:
      // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return (connector as WalletConnectConnector).getNamespaceChainsIds?.().length
        ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          (connector as WalletConnectConnector).getNamespaceChainsIds?.()
        : ALL_CHAIN_IDS
    default:
      return ALL_CHAIN_IDS
  }
}

// Returns the chain ids supported by the user's connected wallet (note: MUST BE WITHIN UNISWAP CONTEXT)
function useConnectedWalletSupportedChains(): UniverseChainId[] {
  const connector = useConnectorWithCatch()
  return useMemo(() => getConnectorSupportedChains(connector), [connector])
}

export function useIsModeMismatch(chainId?: UniverseChainId): boolean {
  const { isTestnetModeEnabled } = useEnabledChains()
  return isTestnetChain(chainId ?? UniverseChainId.Mainnet) ? !isTestnetModeEnabled : isTestnetModeEnabled
}

export function useEnabledChains(options?: { platform?: Platform; includeTestnets?: boolean }): EnabledChainsInfo {
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
        platform: options?.platform,
        includeTestnets: options?.includeTestnets,
        isTestnetModeEnabled,
        connectedWalletChainIds,
        featureFlaggedChainIds,
      }),
    [
      options?.platform,
      options?.includeTestnets,
      isTestnetModeEnabled,
      connectedWalletChainIds,
      featureFlaggedChainIds,
    ],
  )

  const orderedChains = useOrderedChainIds(unorderedChains)

  return useMemo(() => {
    return { chains: orderedChains, gqlChains, defaultChainId, isTestnetModeEnabled }
  }, [defaultChainId, gqlChains, isTestnetModeEnabled, orderedChains])
}

// use in non hook contexts
export function createGetEnabledChains(ctx: {
  getIsTestnetModeEnabled: () => boolean
  getConnector?: () => Connector | undefined
  getFeatureFlaggedChainIds: () => UniverseChainId[]
}): () => EnabledChainsInfo {
  const { getIsTestnetModeEnabled, getConnector, getFeatureFlaggedChainIds } = ctx
  return () =>
    getEnabledChains({
      isTestnetModeEnabled: getIsTestnetModeEnabled(),
      // just fyi no connector on mobile
      connectedWalletChainIds: getConnectorSupportedChains(getConnector?.()),
      featureFlaggedChainIds: getFeatureFlaggedChainIds(),
    })
}

// Note: can be used outside of Uniswap context
export function useEnabledChainsWithConnector(connector?: Connector): {
  chains: UniverseChainId[]
  gqlChains: GqlChainId[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
} {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const connectedWalletChainIds = useMemo(() => getConnectorSupportedChains(connector), [connector])
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)

  return useMemo(
    () =>
      getEnabledChains({
        isTestnetModeEnabled,
        connectedWalletChainIds,
        featureFlaggedChainIds,
      }),
    [isTestnetModeEnabled, connectedWalletChainIds, featureFlaggedChainIds],
  )
}
