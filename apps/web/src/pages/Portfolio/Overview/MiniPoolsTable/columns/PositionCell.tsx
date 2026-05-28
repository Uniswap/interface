import { memo } from 'react'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { Cell } from '~/components/Table/Cell'
import { hasRow } from '~/components/Table/utils/hasRow'

interface PositionCellProps {
  info: { row: { original: PositionInfo } }
  render: (position: PositionInfo) => React.ReactNode
  justifyContent?: 'flex-start' | 'center' | 'flex-end'
  loading?: boolean
}

export const PositionCell = memo(function PositionCell({
  info,
  render,
  justifyContent = 'flex-end',
  loading = false,
}: PositionCellProps) {
  return (
    <Cell loading={loading} justifyContent={justifyContent}>
      {hasRow<PositionInfo>(info) ? render(info.row.original) : null}
    </Cell>
  )
})
