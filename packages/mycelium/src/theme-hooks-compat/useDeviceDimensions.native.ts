/**
 * Native leg lands with the native parity harness (INFRA-2353); until then
 * the compat must fail loudly rather than return unverified values.
 */
import { PlatformSplitStubError } from '@universe/environment'
import type { DeviceDimensions } from './useDeviceDimensions'

export type { DeviceDimensions } from './useDeviceDimensions'

export function useDeviceDimensions(): DeviceDimensions {
  throw new PlatformSplitStubError('useDeviceDimensions (theme-hooks compat): native leg is blocked on INFRA-2353')
}
