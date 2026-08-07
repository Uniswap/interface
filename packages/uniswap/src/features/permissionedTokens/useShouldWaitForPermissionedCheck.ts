import { type Currency } from '@uniswap/sdk-core'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'

// SHORT-TERM: permissioned pools require a different Universal Router version, which the
// trading API resolves synchronously from a per-token cache when a quote fires. On a cold form the
// /permissions cache hasn't resolved yet, so the first quote for a not-yet-confirmed permissioned
// token would ship the default UR header and be routed incorrectly until a later poll. Callers gate
// the quote on this flag so the request waits until the permission check for the pair has resolved;
// once it has, the cache is warm and subsequent quotes don't wait. Removable alongside the rest of
// the permissioned-UR-version machinery; see permissionedTokenStatusCache.ts.
//
// usePermissionedSwapPair's query is disabled (returns isLoading=false) for pairs with no checkable
// token, so non-permissioned-eligible pairs are never gated beyond the single in-flight /permissions
// round trip that already fires for every pair.
export function useShouldWaitForPermissionedCheck({
  inputCurrency,
  outputCurrency,
  walletAddress,
}: {
  inputCurrency: Currency | undefined
  outputCurrency: Currency | undefined
  walletAddress: string | undefined
}): boolean {
  const { isLoading } = usePermissionedSwapPair({ inputCurrency, outputCurrency, walletAddress })
  return isLoading
}
