import type { AppTFunction } from 'ui/src/i18n/types'

export type ColumnId = 'pool' | 'position' | 'distribution' | 'liquidity' | 'fees' | 'apr' | 'created' | 'menu'

export type SortKey = 'range_distance' | 'value_usd' | 'fees_usd' | 'apr' | 'created_at'

export function getColumnLabel(id: ColumnId, t: AppTFunction): string {
  switch (id) {
    case 'pool':
      return t('liquidityPool.positions.table.column.pool')
    case 'position':
      return t('liquidityPool.positions.table.column.position')
    case 'distribution':
      return t('liquidityPool.positions.table.column.distribution')
    case 'liquidity':
      return t('liquidityPool.positions.table.column.liquidity')
    case 'fees':
      return t('liquidityPool.positions.table.column.fees')
    case 'apr':
      return t('liquidityPool.positions.table.column.apr')
    case 'created':
      return t('liquidityPool.positions.table.column.created')
    case 'menu':
      return ''
    default:
      return id satisfies never
  }
}
