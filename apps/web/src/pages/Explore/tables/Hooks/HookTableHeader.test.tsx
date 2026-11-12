import userEvent from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Table } from '~/components/Table'
import { OrderDirection } from '~/data/util'
import { HookSortField, type HookVolumePeriod } from '~/features/Hooks/types'
import { getHooksTableColumns } from '~/pages/Explore/tables/Hooks/hooksTableColumns'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

function HeaderTable({
  period,
  direction,
  onSort = () => OrderDirection.Desc,
}: {
  period: HookVolumePeriod
  direction: OrderDirection
  onSort?: (field: HookSortField) => OrderDirection
}): JSX.Element {
  const { t } = useTranslation()
  const columns = getHooksTableColumns({
    t,
    mobile: false,
    narrow: false,
    period,
    sortField: HookSortField.Volume,
    sortDirection: direction,
    onSort,
  })

  return <Table columns={columns} data={[]} />
}

describe('HookTableHeader', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sorts the selected metric once per pointer, Enter and Space activation', async () => {
    const onSort = vi
      .fn<(field: HookSortField) => OrderDirection>()
      .mockReturnValueOnce(OrderDirection.Desc)
      .mockReturnValueOnce(OrderDirection.Asc)
      .mockReturnValueOnce(OrderDirection.Desc)
    render(<HeaderTable period="7d" direction={OrderDirection.Asc} onSort={onSort} />)
    const button = screen.getByRole('button', { name: '7D vol' })

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Pools' })).toHaveFocus()
    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.click(button)
    expect(onSort).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Enter}')
    expect(onSort).toHaveBeenCalledTimes(2)
    await userEvent.keyboard(' ')
    expect(onSort).toHaveBeenCalledTimes(3)
    expect(onSort.mock.calls).toEqual([[HookSortField.Volume], [HookSortField.Volume], [HookSortField.Volume]])
    expect(vi.mocked(sendAnalyticsEvent).mock.calls).toEqual(
      [OrderDirection.Desc, OrderDirection.Asc, OrderDirection.Desc].map((sortDirection) => [
        InterfaceEventName.ExploreTableSorted,
        { table_type: 'hooks', sort_method: 'volume_7d', sort_direction: sortDirection, surface: 'explore' },
      ]),
    )
    expect(button).toHaveFocus()
  })

  it.each([
    { period: '1d', label: '1D vol', method: 'volume_1d' },
    { period: '30d', label: '30D vol', method: 'volume_30d' },
    { period: '7d', label: 'TVL', method: 'tvl' },
    { period: '7d', label: 'Pools', method: 'pools' },
  ] as const)('reports $method with the direction returned by the sort handler', async ({ period, label, method }) => {
    render(<HeaderTable period={period} direction={OrderDirection.Asc} onSort={() => OrderDirection.Desc} />)

    await userEvent.click(screen.getByRole('button', { name: label }))

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(InterfaceEventName.ExploreTableSorted, {
      table_type: 'hooks',
      sort_method: method,
      sort_direction: OrderDirection.Desc,
      surface: 'explore',
    })
  })

  it('preserves the focused header button and updates its label when the period changes', () => {
    const { rerender } = render(<HeaderTable period="1d" direction={OrderDirection.Desc} />)
    const button = screen.getByRole('button', { name: '1D vol' })
    button.focus()

    rerender(<HeaderTable period="7d" direction={OrderDirection.Asc} />)

    expect(screen.getByRole('button', { name: '7D vol' })).toBe(button)
    expect(button).toHaveFocus()
  })
})
