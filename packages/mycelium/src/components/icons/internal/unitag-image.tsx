/**
 * Base leg of the Unitag badge image: `tsc` resolves only this file, so it
 * carries the web leg's signature and throws if a bundler without
 * platform-extension priority ever loads it.
 */
import { PlatformSplitStubError } from '@universe/environment'
import type { ReactElement } from 'react'

export function UnitagImage(_props: { size: number | string }): ReactElement {
  throw new PlatformSplitStubError('UnitagImage')
}
