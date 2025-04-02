import { SkeletonProps } from 'ui/src/loading/SkeletonProps'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function Skeleton(_props: SkeletonProps): JSX.Element {
  throw new PlatformSplitStubError('Skeleton')
}
