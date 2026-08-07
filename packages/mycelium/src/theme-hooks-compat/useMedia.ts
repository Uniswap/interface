/**
 * Platform-split base stub — bundlers resolve `useMedia.web` /
 * `useMedia.native` (the `ui/src` convention). Shared types live here.
 */
import { PlatformSplitStubError } from '@universe/environment'
import type { MediaQueryKey } from './tokens'

export type MediaState = Readonly<Record<MediaQueryKey, boolean>>

export function useMedia(): MediaState {
  throw new PlatformSplitStubError('useMedia')
}
