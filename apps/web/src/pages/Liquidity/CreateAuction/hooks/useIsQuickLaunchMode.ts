import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

/**
 * Whether the wizard is effectively in quick-launch mode. The store default is `true`
 * (quick launch is the default path), so every consumer must gate on this hook rather than the raw
 * `quickLaunch` flag: the mode only applies behind the feature flag and for factory-minted new tokens.
 */
export function useIsQuickLaunchMode(): boolean {
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  return useCreateAuctionStore(
    (state) => isQuickLaunchFlagEnabled && state.quickLaunch && state.tokenForm.mode === TokenMode.CREATE_NEW,
  )
}
