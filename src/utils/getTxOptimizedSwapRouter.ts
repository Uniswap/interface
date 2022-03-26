import { ApprovalState } from 'lib/hooks/useApproval'

export enum SwapRouterVersion {
  V2,
  V3,
  V2V3,
}

/**
 * Returns the swap router that will result in the least amount of txs (less gas) for a given swap.
 * Heuristic:
 * - if trade contains a single v2-only trade & V2 SwapRouter is approved: use V2 SwapRouter
 * - if trade contains only v3 & V3 SwapRouter is approved: use V3 SwapRouter
 * - else: approve and use V2+V3 SwapRouter
 */
export function getTxOptimizedSwapRouter({
  onlyV2Routes,
  onlyV3Routes,
  tradeHasSplits,
  approvalStates,
}: {
  onlyV2Routes: boolean | undefined
  onlyV3Routes: boolean | undefined
  tradeHasSplits: boolean | undefined
  approvalStates: { v2: ApprovalState; v3: ApprovalState; v2V3: ApprovalState }
}): SwapRouterVersion | undefined {
  if ([approvalStates.v2, approvalStates.v3, approvalStates.v2V3].includes(ApprovalState.PENDING)) return undefined
  if (approvalStates.v2V3 === ApprovalState.APPROVED) return SwapRouterVersion.V2V3
  if (approvalStates.v2 === ApprovalState.APPROVED && onlyV2Routes && !tradeHasSplits) return SwapRouterVersion.V2
  if (approvalStates.v3 === ApprovalState.APPROVED && onlyV3Routes) return SwapRouterVersion.V3
  return SwapRouterVersion.V2V3
}
