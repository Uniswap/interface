import { PropsWithChildren } from 'react'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface PositionItemContextMenuProps {
  positionInfo: PositionInfo
  isVisible: boolean
  onReportSuccess?: () => void
  onRowPress?: () => void
  onManagePress?: () => void
  onPoolInfoPress?: () => void
}

export function PositionItemContextMenu(_props: PropsWithChildren<PositionItemContextMenuProps>): JSX.Element {
  throw new PlatformSplitStubError('PositionItemContextMenu')
}
