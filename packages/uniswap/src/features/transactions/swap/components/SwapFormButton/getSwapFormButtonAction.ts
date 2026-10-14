import type { ReviewGateActionType } from 'uniswap/src/features/transactions/swap/services/prepareSwapService'
import { SwapFormButtonAction } from 'uniswap/src/features/transactions/swap/types/swapFormButtonAction'

/**
 * Priority order of the swap form CTA press. `SwapFormButton` dispatches on the result; everything from
 * `Redirect` down is `handleOnReviewPress`, which resolves `reviewGateActionType` via the same `getReviewGateActionType`.
 */
export function getSwapFormButtonAction({
  shouldOpenVerifyIdentityModal,
  needsGeoAcknowledgment,
  promptWebFORNudge,
  reviewGateActionType,
  isMissingPlatformWallet,
}: {
  shouldOpenVerifyIdentityModal: boolean
  needsGeoAcknowledgment: boolean
  promptWebFORNudge: boolean
  reviewGateActionType: ReviewGateActionType | undefined
  isMissingPlatformWallet: boolean
}): SwapFormButtonAction {
  if (shouldOpenVerifyIdentityModal) {
    return SwapFormButtonAction.VerifyIdentity
  }
  if (needsGeoAcknowledgment) {
    return SwapFormButtonAction.GeoAcknowledgment
  }
  if (promptWebFORNudge) {
    return SwapFormButtonAction.AddFunds
  }
  switch (reviewGateActionType) {
    case 'REDIRECT':
      return SwapFormButtonAction.Redirect
    case 'CONNECT_WALLET':
      return isMissingPlatformWallet ? SwapFormButtonAction.ConnectPlatform : SwapFormButtonAction.ConnectWallet
    case 'SHOW_VIEW_ONLY':
      return SwapFormButtonAction.ViewOnly
    default:
      return SwapFormButtonAction.Review
  }
}
