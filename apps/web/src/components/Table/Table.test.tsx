import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { logger } from 'utilities/src/logger/logger'
import { Table } from '~/components/Table'
import { CollapsiblePinnedColumnScope } from '~/components/Table/PinnedColumns/collapse/CollapsiblePinnedColumnScope'
import { resolveCollapsiblePinnedColumn } from '~/components/Table/PinnedColumns/collapse/resolveCollapsiblePinnedColumn'
import {
  COLLAPSE_PROGRESS_VAR,
  DEFAULT_COLLAPSED_COLUMN_WIDTH,
  getPinnedColumnWidthCss,
} from '~/components/Table/PinnedColumns/collapse/utils'
import type { TableColumnMeta } from '~/components/Table/types'
import { act, fireEvent, render, screen } from '~/test-utils/render'

type Row = { name: string; value: number }

const columnHelper = createColumnHelper<Row>()
const columns: ColumnDef<Row, any>[] = [
  columnHelper.accessor('name', {
    id: 'name',
    size: 190,
    meta: { flexGrow: 1 },
    header: () => 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('value', {
    size: 120,
    header: () => 'Value',
    cell: (info) => info.getValue(),
  }),
]
const data: Row[] = [{ name: 'Alpha', value: 1 }]

const getMeta = (column: ColumnDef<Row, any>): TableColumnMeta | undefined => column.meta as TableColumnMeta | undefined

/** Elements a collapse is driving: the hook writes its progress to its root as soon as it attaches. */
const getCollapseRoots = (): HTMLElement[] =>
  Array.from(document.body.querySelectorAll<HTMLElement>('*')).filter(
    (element) => element.style.getPropertyValue(COLLAPSE_PROGRESS_VAR) !== '',
  )

describe('resolveCollapsiblePinnedColumn', () => {
  it('merges the collapse meta over the column meta it already has', () => {
    const { columns: resolved, widths } = resolveCollapsiblePinnedColumn({ columns, collapsiblePinnedColumnId: 'name' })

    expect(widths).toEqual({ expandedWidth: 190, collapsedWidth: DEFAULT_COLLAPSED_COLUMN_WIDTH })
    expect(getMeta(resolved[0])).toEqual({
      flexGrow: 1,
      widthOverride: getPinnedColumnWidthCss({ expandedWidth: 190, collapsedWidth: DEFAULT_COLLAPSED_COLUMN_WIDTH }),
      trailingMarginCss: expect.stringContaining(COLLAPSE_PROGRESS_VAR),
    })
    expect(resolved[1]).toBe(columns[1])
  })

  it('takes the collapsed width from the column meta and resolves an accessorKey id', () => {
    const { columns: resolved, widths } = resolveCollapsiblePinnedColumn({
      columns: [{ ...columns[1], meta: { collapsedWidth: 48 } }],
      collapsiblePinnedColumnId: 'value',
    })

    expect(widths).toEqual({ expandedWidth: 120, collapsedWidth: 48 })
    expect(getMeta(resolved[0])?.widthOverride).toBe(
      getPinnedColumnWidthCss({ expandedWidth: 120, collapsedWidth: 48 }),
    )
  })

  it('derives a nested accessorKey id the way tanstack does', () => {
    const nestedColumn: ColumnDef<Row, any> = { accessorKey: 'stats.price.usd', size: 100 }

    expect(
      resolveCollapsiblePinnedColumn({ columns: [nestedColumn], collapsiblePinnedColumnId: 'stats_price_usd' }).widths,
    ).toEqual({ expandedWidth: 100, collapsedWidth: DEFAULT_COLLAPSED_COLUMN_WIDTH })
  })

  it('leaves the columns untouched without a collapsible column', () => {
    expect(resolveCollapsiblePinnedColumn({ columns, collapsiblePinnedColumnId: undefined })).toEqual({
      columns,
      widths: undefined,
    })
    // A column omitted at this breakpoint is simply not collapsible.
    expect(resolveCollapsiblePinnedColumn({ columns, collapsiblePinnedColumnId: 'missing' }).widths).toBeUndefined()
  })
})

describe('Table collapsiblePinnedColumnId', () => {
  it('paints the pinned column against the collapse progress', () => {
    render(
      <Table
        columns={columns}
        data={data}
        defaultPinnedColumns={['name']}
        forcePinning
        collapsiblePinnedColumnId="name"
      />,
    )

    // The header and body cells render the content directly, so the text match is the cell itself.
    const width = getPinnedColumnWidthCss({ expandedWidth: 190, collapsedWidth: DEFAULT_COLLAPSED_COLUMN_WIDTH })
    expect(screen.getByText('Name').style.width).toBe(width)
    expect(screen.getByText('Alpha').style.width).toBe(width)
  })

  it('renders the column untouched without the prop', () => {
    render(<Table columns={columns} data={data} defaultPinnedColumns={['name']} forcePinning />)

    const headerCell = screen.getByText('Name')
    expect(headerCell.style.width).toBe('190px')
    expect(headerCell.style.marginRight).toBe('')
  })

  it('only collapses the column when it is the first pinned one', () => {
    // The misplacement warning is dev-only; silence it in case this environment counts as dev.
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const { unmount } = render(
      <Table
        columns={columns}
        data={data}
        defaultPinnedColumns={['value', 'name']}
        forcePinning
        collapsiblePinnedColumnId="name"
      />,
    )
    expect(getCollapseRoots()).toEqual([])
    unmount()

    render(
      <Table
        columns={columns}
        data={data}
        defaultPinnedColumns={['name', 'value']}
        forcePinning
        collapsiblePinnedColumnId="name"
      />,
    )
    expect(getCollapseRoots()).toHaveLength(1)
  })
})

describe('CollapsiblePinnedColumnScope', () => {
  function ScopedTables({ tableCount }: { tableCount: number }): JSX.Element {
    return (
      <CollapsiblePinnedColumnScope>
        {Array.from({ length: tableCount }, (_, index) => (
          <Table
            key={index}
            columns={columns}
            data={data}
            defaultPinnedColumns={['name']}
            forcePinning
            collapsiblePinnedColumnId="name"
          />
        ))}
      </CollapsiblePinnedColumnScope>
    )
  }

  it('runs one collapse above every table it wraps until the last one unmounts', () => {
    const { rerender } = render(<ScopedTables tableCount={2} />)

    // One root, above both tables, rather than one per table.
    const collapseRoots = getCollapseRoots()
    expect(collapseRoots).toHaveLength(1)
    for (const cell of screen.getAllByText('Alpha')) {
      expect(collapseRoots[0]).toContainElement(cell)
    }

    // A lazily mounted table unmounting hands the collapse back to the one still registered.
    rerender(<ScopedTables tableCount={1} />)
    expect(getCollapseRoots()).toEqual(collapseRoots)

    rerender(<ScopedTables tableCount={0} />)
    expect(getCollapseRoots()).toEqual([])
  })
})

describe('Table hiddenRows and loadMore', () => {
  it('counts hidden rows toward load-more growth only while they are shown', () => {
    const completions: (() => void)[] = []
    const loadMore = vi.fn(({ onComplete }: { onComplete?: () => void }) => {
      completions.push(() => onComplete?.())
    })
    const complete = () => act(() => completions.shift()?.())
    const hidden = (count: number): Row[] =>
      Array.from({ length: count }, (_, i) => ({ name: `Hidden ${i}`, value: 0 }))

    // jsdom reports no scroll height, so the table reads as shorter than the viewport and fetches on mount.
    const view = render(<Table columns={columns} data={data} loadMore={loadMore} hiddenRows={hidden(1)} />)
    expect(loadMore).toHaveBeenCalledTimes(1)
    complete()
    expect(loadMore).toHaveBeenCalledTimes(2)
    complete()
    expect(loadMore).toHaveBeenCalledTimes(2)

    view.rerender(<Table columns={columns} data={data} loadMore={loadMore} hiddenRows={hidden(2)} />)
    expect(loadMore).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByText('Show hidden rows'))
    expect(loadMore).toHaveBeenCalledTimes(3)
    complete()

    view.rerender(<Table columns={columns} data={data} loadMore={loadMore} hiddenRows={hidden(3)} />)
    expect(loadMore).toHaveBeenCalledTimes(4)
  })
})
