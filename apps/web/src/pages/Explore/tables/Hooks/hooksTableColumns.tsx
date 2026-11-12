import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Text } from '@universe/mycelium'
import type { TFunction } from 'i18next'
import { HeaderCell } from '~/components/Table/styled'
import { getFixedColumnSizing, getFlexColumnSizing } from '~/components/Table/utils/columnSizing'
import { OrderDirection } from '~/data/util'
import { HookSortField, type HookVolumePeriod } from '~/features/Hooks/types'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'
import { HookTableIdentityCell, HookTableMetricCell } from '~/pages/Explore/tables/Hooks/HookTableCell'
import { HookTableHeader, type HookMetricHeaderMeta } from '~/pages/Explore/tables/Hooks/HookTableHeader'

const columnHelper = createColumnHelper<HookTableRow>()

export function getHooksTableColumns({
  t,
  mobile,
  narrow,
  period,
  sortField,
  sortDirection,
  onSort,
}: {
  t: TFunction
  mobile: boolean
  narrow: boolean
  period: HookVolumePeriod
  sortField: HookSortField
  sortDirection: OrderDirection
  onSort: (field: HookSortField) => OrderDirection
}): ColumnDef<HookTableRow, unknown>[] {
  const volumeLabels: Record<HookVolumePeriod, string> = {
    '1d': t('stats.volume.1d.short'),
    '7d': t('stats.volume.7d.short'),
    '30d': t('pool.volume.thirtyDay.short'),
  }
  const metrics = [
    { id: HookSortField.Pools, label: t('common.pools'), width: mobile ? 80 : 150, format: 'count' },
    { id: HookSortField.Volume, label: volumeLabels[period], width: mobile ? 110 : 150, format: 'fiat' },
    { id: HookSortField.Tvl, label: t('common.totalValueLocked'), width: mobile ? 110 : 150, format: 'fiat' },
  ] as const

  return [
    columnHelper.display({
      id: 'identity',
      ...(mobile ? getFixedColumnSizing(narrow ? 180 : 202) : getFlexColumnSizing(300)),
      header: () => (
        <HeaderCell justifyContent="flex-start" px={mobile ? '$spacing8' : '$spacing12'} minHeight={52}>
          <Text variant="body3" color="$neutral2">
            {t('hooks.preview.name')}
          </Text>
        </HeaderCell>
      ),
      cell: HookTableIdentityCell,
    }),
    ...metrics.map((metric) => {
      const active = metric.id === sortField
      const meta: HookMetricHeaderMeta = {
        metric: metric.id,
        format: metric.format,
        label: metric.label,
        active,
        direction: sortDirection,
        period,
        onSort,
      }
      return columnHelper.display({
        id: metric.id,
        ...getFixedColumnSizing(metric.width, meta),
        header: HookTableHeader,
        cell: HookTableMetricCell,
      })
    }),
  ]
}
