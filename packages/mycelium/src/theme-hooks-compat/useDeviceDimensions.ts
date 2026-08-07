/**
 * Platform-split base stub — bundlers resolve `useDeviceDimensions.web` /
 * `useDeviceDimensions.native` (the `ui/src` convention). Shared types live here.
 */
import { PlatformSplitStubError } from '@universe/environment'
export interface DeviceDimensions {
  fullHeight: number
  fullWidth: number
}

export function useDeviceDimensions(): DeviceDimensions {
  throw new PlatformSplitStubError('useDeviceDimensions')
}
