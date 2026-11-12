import type { HeaderContext } from '@tanstack/react-table'
import { Button } from '@universe/mycelium'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { HeaderCell } from '~/components/Table/styled'
import type { OrderDirection } from '~/data/util'
import type { HookSortField, HookVolumePeriod } from '~/features/Hooks/types'
import { getHookSortMethod } from '~/pages/Explore/tables/Hooks/getHookSortAnalyticsValue'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'
import type { HookMetricColumnMeta } from '~/pages/Explore/tables/Hooks/HookTableCell'

export interface HookMetricHeaderMeta extends HookMetricColumnMeta {
  label: string
  active: boolean
  direction: OrderDirection
  period: HookVolumePeriod
  onSort: (field: HookSortField) => OrderDirection
}

// TanStack renders headers as component types; keep this stable to preserve focus after sorting.
export function HookTableHeader({ column }: HeaderContext<HookTableRow, unknown>): JSX.Element {
  const { metric, label, active, direction, period, onSort } = column.columnDef.meta as HookMetricHeaderMeta
  const handleSort = (): void => {
    const sortDirection = onSort(metric)
    sendAnalyticsEvent(InterfaceEventName.ExploreTableSorted, {
      table_type: 'hooks',
      sort_method: getHookSortMethod({ sortField: metric, period }),
      sort_direction: sortDirection,
      surface: 'explore',
    })
  }

  return (
    <HeaderCell minHeight={52} px="$spacing12" py="$none" width="100%">
      <Button
        emphasis="text-only"
        fill={false}
        width="100%"
        height={44}
        p="$none"
        gap="$gap4"
        justifyContent="flex-end"
        borderRadius="$rounded4"
        onPress={handleSort}
      >
        {active && <HeaderArrow orderDirection={direction} size="$icon.16" />}
        <HeaderSortText active={active}>{label}</HeaderSortText>
      </Button>
    </HeaderCell>
  )
}
