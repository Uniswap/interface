// Test-only mock for `PermissionedTokenInfoBottomSheet` used by both
// `PermissionedSwapBanner.test.tsx` and `PermissionedTokenWarningCard.test.tsx`.
// The real component renders inside a portal-based Modal that JSDOM can't see
// through; this version emits a flat <div> so the tests can assert on visibility.
export function PermissionedTokenInfoBottomSheet({
  isOpen,
  tokenSymbol,
}: {
  isOpen: boolean
  tokenSymbol: string
}): JSX.Element | null {
  return isOpen ? <div data-testid="info-sheet">{tokenSymbol}</div> : null
}
