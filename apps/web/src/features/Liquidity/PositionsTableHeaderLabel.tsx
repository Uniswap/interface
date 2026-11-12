import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { HeaderCell } from '~/components/Table/styled'
import {
  getColumnLabel,
  type ColumnId,
  type PositionSort,
  type PositionSortField,
} from '~/features/Liquidity/PositionsTableColumns'

type CellAlign = 'flex-start' | 'flex-end' | 'center'

export function HeaderLabel({
  id,
  align,
  sortField,
  sort,
  onSort,
  noTrailingPadding,
}: {
  id: ColumnId
  align: CellAlign
  sortField?: PositionSortField
  sort?: PositionSort
  onSort?: (field: PositionSortField) => void
  // The collapsed pinned column leaves its label only 32px between paddings, too narrow for some
  // translations (zh-CN "资金池" is 42px); dropping the right padding gives it the column's spare room.
  noTrailingPadding?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const label = getColumnLabel(id, t)

  if (!sortField || !onSort) {
    return (
      <HeaderCell justifyContent={align} {...(noTrailingPadding ? { pr: '$none' } : undefined)}>
        <Text variant="body3" color="$neutral2" userSelect="none" numberOfLines={1}>
          {label}
        </Text>
      </HeaderCell>
    )
  }

  const isActive = sort?.field === sortField
  return (
    <HeaderCell justifyContent={align} clickable>
      <TouchableArea hoverable onPress={() => onSort(sortField)}>
        <Flex row alignItems="center" gap="$spacing4" justifyContent={align}>
          {isActive && <HeaderArrow orderDirection={sort.direction} size="$icon.16" />}
          <HeaderSortText active={isActive}>{label}</HeaderSortText>
        </Flex>
      </TouchableArea>
    </HeaderCell>
  )
}
