/**
 * Base leg of `OSDynamicCloudIcon`'s glyph: `tsc` resolves only this file, so
 * it carries the web leg's type and throws if a bundler without
 * platform-extension priority ever loads it.
 */
import { PlatformSplitStubError } from '@universe/environment'
import { forwardRef } from 'react'
import type { GeneratedIcon } from '../../factories/createIcon'

export const OSCloudGlyph: GeneratedIcon = forwardRef(() => {
  throw new PlatformSplitStubError('OSCloudGlyph')
})
OSCloudGlyph.displayName = 'OSCloudGlyph'
