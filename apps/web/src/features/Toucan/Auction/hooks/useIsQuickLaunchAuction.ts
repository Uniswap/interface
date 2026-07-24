import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { isQuickLaunchAuctionData } from '~/features/Toucan/utils/quickLaunchClassification'

/**
 * Whether the detail page's auction is a quick launch, per the backend `is_quick_launch`
 * classification (see {@link isQuickLaunchAuctionData}). Flag-gated so the quick-launch badge /
 * treatment only appears behind the off-by-default `quick_launch` flag.
 *
 * COSMETIC / DISCOVERY ONLY. This must NOT be used to suppress Blockaid / token-protection warnings:
 * the classifier is forgeable by construction, so warnings stay on for every auction. Any
 * protection-exemption policy is deferred to security review (LP-1076).
 */
export function useIsQuickLaunchAuction(): boolean {
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  return isQuickLaunchFlagEnabled && auctionDetails !== null && isQuickLaunchAuctionData(auctionDetails)
}
