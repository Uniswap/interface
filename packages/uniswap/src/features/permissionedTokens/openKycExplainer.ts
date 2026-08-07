import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

// Shared "Learn more about identity verification" handler. The KYC explainer URL is
// referenced from multiple bottom-sheet headers (VerifyIdentityBottomSheet,
// PermissionedTokenInfoBottomSheet); centralizing the open + log path keeps analytics
// and the failure shape consistent if either ever changes.
export function openKycExplainer(callerName: string): void {
  openUri({ uri: UniswapHelpUrls.articles.kycExplainer, openExternalBrowser: true, isSafeUri: true }).catch(
    (error: unknown) => {
      logger.warn(callerName, 'openKycExplainer', 'openUri failed', { error })
    },
  )
}
