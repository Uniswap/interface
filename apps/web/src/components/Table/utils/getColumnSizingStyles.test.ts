import type { Column, Table } from '@tanstack/react-table'
import type { TableColumnMeta } from '~/components/Table/types'
import { getColumnSizingStyles, getPinnedRegionWidthCss } from '~/components/Table/utils/getColumnSizingStyles'

function pinnedColumn(meta: TableColumnMeta): Column<unknown, unknown> {
  return { columnDef: { meta }, getSize: () => 225, getIsPinned: () => 'left' } as unknown as Column<unknown, unknown>
}

describe('getColumnSizingStyles', () => {
  it('lets an opted-in pinned column grow', () => {
    expect(getColumnSizingStyles(pinnedColumn({ flexGrow: 1 }))).toMatchObject({ width: 225, flexGrow: 1 })
  })

  it('pins a width-overridden column to the override so it stays under the divider', () => {
    const widthOverride = 'calc(225px - 153px)'
    expect(getColumnSizingStyles(pinnedColumn({ flexGrow: 1, widthOverride }))).toEqual({
      width: widthOverride,
      minWidth: widthOverride,
      maxWidth: widthOverride,
      flexShrink: 0,
      flexGrow: 0,
    })
  })
})

describe('getPinnedRegionWidthCss', () => {
  const tableWith = (columns: Column<unknown, unknown>[]): Table<unknown> =>
    ({ getLeftVisibleLeafColumns: () => columns }) as unknown as Table<unknown>

  it('defers to the tanstack sizes when no pinned column overrides its width', () => {
    expect(getPinnedRegionWidthCss(tableWith([pinnedColumn({ flexGrow: 1 })]))).toBeUndefined()
  })

  it('sums overridden and sized pinned columns', () => {
    const widthOverride = 'calc(225px - 153px)'
    expect(getPinnedRegionWidthCss(tableWith([pinnedColumn({}), pinnedColumn({ widthOverride })]))).toBe(
      `calc(225px + ${widthOverride})`,
    )
  })
})
