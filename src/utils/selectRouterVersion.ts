import { ApprovalState } from 'hooks/useApproveCallback'

export function selectRouterVersion({
  onlyV2Routes,
  onlyV3Routes,
  routeHasSplits,
  approvalStates,
}: {
  onlyV2Routes: boolean | undefined
  onlyV3Routes: boolean | undefined
  routeHasSplits: boolean | undefined
  approvalStates: { v2: ApprovalState; v3: ApprovalState; v2V3: ApprovalState }
}): 'v2' | 'v3' | 'v2V3' {
  if ([approvalStates.v2, approvalStates.v3, approvalStates.v2V3].includes(ApprovalState.PENDING)) return undefined
  if (approvalStates.v2V3 === ApprovalState.APPROVED) return 'v2V3'
  if (approvalStates.v2 === ApprovalState.APPROVED && onlyV2Routes && !routeHasSplits) return 'v2'
  if (approvalStates.v3 === ApprovalState.APPROVED && onlyV3Routes) return 'v3'
  return 'v2V3'
}
