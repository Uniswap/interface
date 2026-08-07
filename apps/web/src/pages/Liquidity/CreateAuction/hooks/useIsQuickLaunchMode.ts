import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useIsQuickLaunchModalFlow } from '~/pages/Liquidity/CreateAuction/quickLaunchModalContext'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

/**
 * Whether the wizard is effectively in quick-launch mode. The store default is `true`
 * (quick launch is the default path), so every consumer must gate on this hook rather than the raw
 * `quickLaunch` flag: the mode only applies behind the feature flag and for factory-minted new tokens.
 * The launches-page create modal is quick-launch-only, so it forces the mode regardless of the flag.
 */
export function useIsQuickLaunchMode(): boolean {
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const isQuickLaunchModalFlow = useIsQuickLaunchModalFlow()
  return useCreateAuctionStore(
    (state) =>
      (isQuickLaunchFlagEnabled || isQuickLaunchModalFlow) &&
      state.quickLaunch &&
      state.tokenForm.mode === TokenMode.CREATE_NEW,
  )
}
