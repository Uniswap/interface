import { PlatformSplitStubError } from 'utilities/src/errors'

export interface OverlapIconWrapperProps {
  children: React.ReactNode
  outerSize: number
  overlapPx: number
  clipBorderRadius: number
}

/**
 * Platform split: use OverlapIconWrapper.web.tsx or OverlapIconWrapper.native.tsx.
 * This stub throws if the platform-specific implementation was not resolved by the bundler.
 */
export function OverlapIconWrapper(_props: OverlapIconWrapperProps): JSX.Element {
  throw new PlatformSplitStubError('OverlapIconWrapper')
}
