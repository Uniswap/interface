import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { vi } from 'vitest'
import { TableRow } from '~/components/Table/TableRow'
import { fireEvent, render, screen } from '~/test-utils/render'

// setupTests.ts stubs Trace to a pass-through Fragment app-wide, which would hide the very
// wiring under test, and stubs @uniswap/analytics-events to an empty object. Restore both —
// the values below are the real upstream enum members.
vi.unmock('uniswap/src/features/telemetry/Trace')
// Trace pulls in @react-navigation/core, whose ESM build does not resolve under the web
// vitest runner; only the navigation-tree branch (not used here) calls into it.
vi.mock('@react-navigation/core', () => ({ useFocusEffect: () => {} }))
vi.mock('@uniswap/analytics-events', () => ({
  SharedEventName: { ELEMENT_CLICKED: 'Element Clicked', PAGE_VIEWED: 'Page Viewed' },
  BrowserEvent: { onClick: 'onClick', onFocus: 'onFocus', onKeyPress: 'onKeyPress' },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
}))

interface TestRow {
  testId: string
  linkState: undefined
  label: string
  analytics: { elementName: ElementName; properties: Record<string, unknown> }
}

const CELL_TEXT = 'WETH'

const DATA: TestRow[] = [
  {
    testId: 'tokens-table-row-weth',
    linkState: undefined,
    label: CELL_TEXT,
    analytics: { elementName: ElementName.TokensTableRow, properties: { chain: 'ethereum' } },
  },
]

const COLUMNS: ColumnDef<TestRow>[] = [{ id: 'label', accessorKey: 'label', cell: (info) => info.getValue() }]

function SingleRowTable(): JSX.Element {
  const table = useReactTable({ data: DATA, columns: COLUMNS, getCoreRowModel: getCoreRowModel() })
  const [row] = table.getRowModel().rows
  return <TableRow<TestRow> row={row} />
}

describe('TableRow analytics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends Element Clicked with the row element name when the row is clicked', () => {
    const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => {})

    render(<SingleRowTable />)
    fireEvent.click(screen.getByText(CELL_TEXT))

    // Expected values are literals on purpose, not the production constants, so a rename on
    // either side fails here instead of silently agreeing with itself.
    expect(sendEvent).toHaveBeenCalledWith(
      'Element Clicked',
      expect.objectContaining({ element: 'tokens-table-row', chain: 'ethereum' }),
    )
  })

  it('does not send Element Clicked without a click', () => {
    const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => {})

    render(<SingleRowTable />)

    expect(sendEvent).not.toHaveBeenCalledWith('Element Clicked', expect.anything())
  })
})
