import { ApprovalState } from 'hooks/useApproveCallback'

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
  approvalStates,
}: {
  approvalStates: { v2: ApprovalState }
}): SwapRouterVersion | undefined {
  if ([approvalStates.v2].includes(ApprovalState.PENDING)) return undefined
  return SwapRouterVersion.V2
}
