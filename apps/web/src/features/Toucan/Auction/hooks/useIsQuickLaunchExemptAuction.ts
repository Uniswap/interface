import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { isQuickLaunchAuctionData } from '~/features/Toucan/utils/quickLaunchAuction'

/**
 * SECURITY REVIEW REQUIRED BEFORE ENABLING FOR REAL USERS: consumers use this to suppress the
 * Blockaid/token-protection warnings (header icon, bid-form card + modal) on the auction detail
 * page for quick-launch auctions — i.e. it hides a user-protection signal for a token class.
 *
 * Double-gated: the off-by-default quick_launch flag AND the quick-launch fingerprint
 * (heuristic match, see {@link isQuickLaunchAuctionData}). Scoped to the detail page's display
 * layer only; the shared Blockaid/token-protection paths (TDP, swap) are untouched.
 */
export function useIsQuickLaunchExemptAuction(): boolean {
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  return isQuickLaunchFlagEnabled && auctionDetails !== null && isQuickLaunchAuctionData(auctionDetails)
}
