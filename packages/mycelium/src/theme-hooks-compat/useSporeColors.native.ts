/**
 * Native leg lands with the native parity harness (INFRA-2353); until then
 * the compat must fail loudly rather than return unverified values.
 */
import { PlatformSplitStubError } from '@universe/environment'
import type { UseSporeColorsReturn } from './useSporeColors'

export type { DynamicColor, SporeColor, SporeColorKey, UseSporeColorsReturn } from './useSporeColors'

export const useSporeColors = (): UseSporeColorsReturn => {
  throw new PlatformSplitStubError('useSporeColors (theme-hooks compat): native leg is blocked on INFRA-2353')
}
