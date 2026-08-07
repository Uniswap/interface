/**
 * Platform-split base stub — bundlers resolve `useIsDarkMode.web` /
 * `useIsDarkMode.native` (the `ui/src` convention).
 */
import { PlatformSplitStubError } from '@universe/environment'
export function useIsDarkMode(): boolean {
  throw new PlatformSplitStubError('useIsDarkMode')
}
