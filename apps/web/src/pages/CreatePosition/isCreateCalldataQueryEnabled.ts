/**
 * Whether to build the create calldata. The request is the sink for `positionState.hook`, so the hook
 * review is enforced here as well as in the overlays that ask for it: no request is built (and so no
 * transaction can be signed) while the hook still owes the user a review (SECURE-333).
 */
export function isCreateCalldataQueryEnabled({
  isUserCommittedToCreate,
  hasInputError,
  hasTransactionError,
  approvalLoading,
  hasApprovalError,
  invalidRange,
  hasApprovalCalldata,
  hasCreateCalldataQueryParams,
  hookNeedsReview,
}: {
  isUserCommittedToCreate: boolean
  hasInputError: boolean
  hasTransactionError: boolean
  approvalLoading: boolean
  hasApprovalError: boolean
  invalidRange: boolean
  hasApprovalCalldata: boolean
  hasCreateCalldataQueryParams: boolean
  hookNeedsReview: boolean
}): boolean {
  return (
    !isUserCommittedToCreate &&
    !hasInputError &&
    !hasTransactionError &&
    !approvalLoading &&
    !hasApprovalError &&
    !invalidRange &&
    hasApprovalCalldata &&
    hasCreateCalldataQueryParams &&
    !hookNeedsReview
  )
}
