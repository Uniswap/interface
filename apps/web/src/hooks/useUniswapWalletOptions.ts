import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { CONNECTION } from 'components/Web3Provider/constants'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useUniswapWalletOptions() {
  const isBetaLive = useFeatureFlag(FeatureFlags.ExtensionBetaLaunch)
  const isGALive = useFeatureFlag(FeatureFlags.ExtensionGeneralLaunch)

  const isExtensionInstalled = Boolean(useConnectorWithId(CONNECTION.UNISWAP_EXTENSION_RDNS))

  return (isBetaLive && isExtensionInstalled) || isGALive
}
