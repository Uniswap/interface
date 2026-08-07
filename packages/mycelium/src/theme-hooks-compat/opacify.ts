/**
 * Platform-split base stub — bundlers resolve `opacify.web` /
 * `opacify.native` (the `ui/src` convention).
 */
import { PlatformSplitStubError } from '@universe/environment'
export function opacify(_opacity: number, _color: string): string {
  throw new PlatformSplitStubError('opacify')
}

export const opacifyRaw = opacify
