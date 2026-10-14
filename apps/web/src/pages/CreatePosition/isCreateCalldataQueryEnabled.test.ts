import { isCreateCalldataQueryEnabled } from '~/pages/CreatePosition/isCreateCalldataQueryEnabled'
describe('isCreateCalldataQueryEnabled', () => {
  const ready = {
    isUserCommittedToCreate: false,
    hasInputError: false,
    hasTransactionError: false,
    approvalLoading: false,
    hasApprovalError: false,
    invalidRange: false,
    hasApprovalCalldata: true,
    hasCreateCalldataQueryParams: true,
    hookNeedsReview: false,
  }

  it('builds the request when every input is ready', () => {
    expect(isCreateCalldataQueryEnabled(ready)).toBe(true)
  })

  // The calldata is where the hook goes on-chain, so an unreviewed hook blocks it regardless of which
  // overlay (if any) is asking the user — a deep link that skips the token-select step included.
  it('does not build the request while the hook still needs review', () => {
    expect(isCreateCalldataQueryEnabled({ ...ready, hookNeedsReview: true })).toBe(false)
  })

  it.each([
    ['isUserCommittedToCreate', { isUserCommittedToCreate: true }],
    ['hasInputError', { hasInputError: true }],
    ['hasTransactionError', { hasTransactionError: true }],
    ['approvalLoading', { approvalLoading: true }],
    ['hasApprovalError', { hasApprovalError: true }],
    ['invalidRange', { invalidRange: true }],
    ['hasApprovalCalldata', { hasApprovalCalldata: false }],
    ['hasCreateCalldataQueryParams', { hasCreateCalldataQueryParams: false }],
  ])('still holds the request on %s', (_name, override) => {
    expect(isCreateCalldataQueryEnabled({ ...ready, ...override })).toBe(false)
  })
})
