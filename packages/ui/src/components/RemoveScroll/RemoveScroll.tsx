import { ReactNode } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface RemoveScrollProps {
  enabled?: boolean
  children?: ReactNode
}

export function RemoveScroll(_: RemoveScrollProps): ReactNode {
  throw new PlatformSplitStubError('RemoveScroll')
}
