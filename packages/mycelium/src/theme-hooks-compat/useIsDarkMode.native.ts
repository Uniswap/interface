/**
 * Native leg lands with the native parity harness (INFRA-2353); until then
 * the compat must fail loudly rather than return unverified values.
 */
import { PlatformSplitStubError } from '@universe/environment'
export function useIsDarkMode(): boolean {
  throw new PlatformSplitStubError('useIsDarkMode (theme-hooks compat): native leg is blocked on INFRA-2353')
}
