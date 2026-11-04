/**
 * Base leg of `CloseIconWithHover`'s platform split: `tsc` resolves only this
 * file, so it carries the web leg's signature and throws if a bundler without
 * platform-extension priority ever loads it.
 */
import { PlatformSplitStubError } from '@universe/environment'
import type { ReactElement } from 'react'
import type { CloseIconProps } from '../CloseIconWithHover'

export function CloseIconFrame(_props: CloseIconProps): ReactElement {
  throw new PlatformSplitStubError('CloseIconFrame')
}
