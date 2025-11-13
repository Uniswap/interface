import { TableText } from 'components/Table/styled'
import { EM_DASH } from 'ui/src'

export function EmptyTableCell() {
  return (
    <TableText variant="body3" color="$neutral2">
      {EM_DASH}
    </TableText>
  )
}
