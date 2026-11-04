import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { DEFAULT_LP_POSITION_STATUS_FILTER, DEFAULT_V2_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
import { ProtocolFilterDropdown, StatusFilterDropdown } from '~/features/Liquidity/positionsFilters'
import { hasActiveControlBarFilter } from '~/features/Liquidity/PositionsTableControlBar'
import { render } from '~/test-utils/render'

function renderStatus({
  selectedStatuses = DEFAULT_V2_POSITION_STATUS_FILTER,
  showHiddenPositions = false,
}: {
  selectedStatuses?: Parameters<typeof StatusFilterDropdown>[0]['selectedStatuses']
  showHiddenPositions?: boolean
}) {
  return render(
    <StatusFilterDropdown
      selectedStatuses={selectedStatuses}
      onToggleStatus={vi.fn()}
      showHiddenPositions={showHiddenPositions}
      setShowHiddenPositions={vi.fn()}
    />,
  )
}

// The menu items render alongside the trigger, so a single-value label like "Closed" also matches its
// checkbox; those cases assert the filter name is gone and the value appears twice.
describe('StatusFilterDropdown trigger', () => {
  it('reads "Status" at the default selection', () => {
    expect(renderStatus({}).getByText('Status')).toBeInTheDocument()
  })

  it('shows a non-default lifecycle selection in place of the filter name', () => {
    const closedOnly = renderStatus({ selectedStatuses: ['closed'] })
    expect(closedOnly.queryByText('Status')).not.toBeInTheDocument()
    expect(closedOnly.getAllByText('Closed')).toHaveLength(2)
    closedOnly.unmount()

    expect(renderStatus({ selectedStatuses: ['closed', 'open'] }).getByText('Open, Closed')).toBeInTheDocument()
  })

  it('shows Hidden even when the lifecycle is at its default', () => {
    expect(renderStatus({ showHiddenPositions: true }).getByText('Open · Hidden')).toBeInTheDocument()
    expect(
      renderStatus({ selectedStatuses: ['closed'], showHiddenPositions: true }).getByText('Closed · Hidden'),
    ).toBeInTheDocument()
  })

  it('labels an empty selection as every lifecycle, which is what it requests', () => {
    expect(renderStatus({ selectedStatuses: [] }).getByText('Open, Closed')).toBeInTheDocument()
    expect(
      renderStatus({ selectedStatuses: [], showHiddenPositions: true }).getByText('Open, Closed · Hidden'),
    ).toBeInTheDocument()
  })
})

describe('ProtocolFilterDropdown trigger', () => {
  const renderProtocol = (selectedVersions: ProtocolVersion[]) =>
    render(<ProtocolFilterDropdown selectedVersions={selectedVersions} onToggleVersion={vi.fn()} />)

  it('reads "Protocol" when every version is selected', () => {
    expect(
      renderProtocol([ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]).getByText('Protocol'),
    ).toBeInTheDocument()
  })

  it('lists the selected versions in menu order in place of the filter name', () => {
    const { getByText, queryByText } = renderProtocol([ProtocolVersion.V3, ProtocolVersion.V4])
    expect(getByText('v4, v3')).toBeInTheDocument()
    expect(queryByText('Protocol')).not.toBeInTheDocument()
  })

  it('says None in place of the filter name when nothing is selected', () => {
    const { getByText, queryByText } = renderProtocol([])
    expect(getByText('None')).toBeInTheDocument()
    expect(queryByText('Protocol')).not.toBeInTheDocument()
  })
})

describe('hasActiveControlBarFilter', () => {
  const defaults = {
    statusFilter: DEFAULT_V2_POSITION_STATUS_FILTER,
    rangeFilter: DEFAULT_LP_POSITION_STATUS_FILTER,
    versionFilter: [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2],
    chainFilter: null,
    showHiddenPositions: false,
    search: '',
  }

  it('is false at the defaults', () => {
    expect(hasActiveControlBarFilter(defaults)).toBe(false)
  })

  it('counts the Hidden toggle as a filter', () => {
    expect(hasActiveControlBarFilter({ ...defaults, showHiddenPositions: true })).toBe(true)
  })
})
