import { ReactNode } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface PoolOptionItemContextMenuProps {
  children: ReactNode
  poolInfo: {
    poolId: string
    chain: number
  }
}

export function PoolOptionItemContextMenu(_: PoolOptionItemContextMenuProps): JSX.Element {
  throw new PlatformSplitStubError('PoolOptionItemContextMenu')
}
