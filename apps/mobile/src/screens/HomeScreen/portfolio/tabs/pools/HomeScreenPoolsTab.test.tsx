import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { makeMutable } from 'react-native-reanimated'
import { HomeScreenPoolsTab } from 'src/screens/HomeScreen/portfolio/tabs/pools/HomeScreenPoolsTab'
import type { PoolsListRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { PositionStatusFilterValue } from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

const mockNavigate = vi.fn()
vi.mock('src/app/navigation/types', async () => ({
  ...(await vi.importActual('src/app/navigation/types')),
  useAppStackNavigation: () => ({ navigate: mockNavigate }),
}))

vi.mock('uniswap/src/components/portfolio/PositionItem/PositionItem', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    PositionItem: ({ positionInfo, onPress }: { positionInfo: { poolId: string }; onPress?: () => void }) => (
      <Text testID={`position-${positionInfo.poolId}`} onPress={onPress}>
        {positionInfo.poolId}
      </Text>
    ),
  }
})

const noop = (): void => undefined

const baseData: PoolsListRenderData = {
  positions: [],
  hiddenPositions: [],
  hasData: true,
  error: null,
  isFetching: false,
  isFetchingNextPage: false,
  isFetchingFirstPage: false,
  isLoadingFirstPage: false,
  hasErrorWithoutData: false,
  hasNextPage: false,
  pagesLoaded: 1,
  refetch: noop,
  onListEndReached: noop,
}

const position = (poolId: string, status: PositionStatus = PositionStatus.IN_RANGE): never =>
  ({ poolId, tokenId: 't', chainId: 1, status }) as never

const mockOnStatusFilterChange = vi.fn()

const renderTab = (
  overrides: Partial<PoolsListRenderData> = {},
  {
    shouldLoadPools = true,
    statusFilter = PositionStatusFilterValue.Open,
  }: { shouldLoadPools?: boolean; statusFilter?: PositionStatusFilterValue } = {},
): void => {
  render(
    <HomeScreenPoolsTab
      owner="0x0000000000000000000000000000000000000001"
      bodyOffsetY={0}
      poolsListRenderData={{ ...baseData, ...overrides }}
      statusFilter={statusFilter}
      onStatusFilterChange={mockOnStatusFilterChange}
      feedScrollValue={makeMutable(0)}
      shouldLoadPools={shouldLoadPools}
      viewportHeight={800}
      onHeightChange={noop}
    />,
  )
}

describe('HomeScreenPoolsTab', () => {
  afterEach(() => {
    mockNavigate.mockClear()
    mockOnStatusFilterChange.mockClear()
  })

  it('renders the loading skeleton while the first page loads (no data)', () => {
    renderTab({ isLoadingFirstPage: true })

    expect(screen.getByTestId('pools-loading-skeleton')).toBeDefined()
    expect(screen.queryByTestId('position-pool-a')).toBeNull()
  })

  it('renders the error state with a retry CTA when the query errors before any data', () => {
    renderTab({ hasErrorWithoutData: true })

    expect(screen.getByText('pool.balances.unavailable')).toBeDefined()
    expect(screen.getByText('common.button.tryAgain')).toBeDefined()
    expect(screen.queryByTestId('pools-loading-skeleton')).toBeNull()
  })

  it('calls refetch when the retry CTA is pressed', () => {
    const refetch = vi.fn()
    renderTab({ hasErrorWithoutData: true, refetch })

    fireEvent.press(screen.getByText('common.button.tryAgain'), { stopPropagation: () => undefined })

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows the loading skeleton instead of the error view while a retry re-drives the list', () => {
    renderTab({ isLoadingFirstPage: true })

    expect(screen.getByTestId('pools-loading-skeleton')).toBeDefined()
    expect(screen.queryByText('pool.balances.unavailable')).toBeNull()
  })

  it('does not render rows until the tab has been visited', () => {
    renderTab({ positions: [position('pool-a')] }, { shouldLoadPools: false })

    expect(screen.queryByTestId('position-pool-a')).toBeNull()
    expect(screen.queryByTestId('pools-loading-skeleton')).toBeNull()
  })

  it('renders position rows once data is available', () => {
    renderTab({ positions: [position('pool-a'), position('pool-b')] })

    expect(screen.getByTestId('position-pool-a')).toBeDefined()
    expect(screen.getByTestId('position-pool-b')).toBeDefined()
    expect(screen.queryByTestId('pools-loading-skeleton')).toBeNull()
  })

  it('navigates to the position details screen when a row is pressed', () => {
    renderTab({ positions: [position('pool-a')] })

    fireEvent.press(screen.getByTestId('position-pool-a'))

    expect(mockNavigate).toHaveBeenCalledWith(
      MobileScreens.PositionDetails,
      expect.objectContaining({ poolId: 'pool-a', tokenId: 't', chainId: 1 }),
    )
  })

  it('does not render the hidden-positions expando when there are no hidden positions', () => {
    renderTab({ positions: [position('pool-a')] })

    expect(screen.queryByTestId(TestID.ExpandoRow)).toBeNull()
  })

  it('renders the hidden-positions expando but keeps hidden rows collapsed by default', () => {
    renderTab({ positions: [position('pool-a')], hiddenPositions: [position('pool-hidden')] })

    expect(screen.getByTestId(TestID.ExpandoRow)).toBeDefined()
    expect(screen.queryByTestId('position-pool-hidden')).toBeNull()
  })

  it('reveals hidden rows when the expando is pressed', () => {
    renderTab({ positions: [position('pool-a')], hiddenPositions: [position('pool-hidden')] })

    fireEvent.press(screen.getByTestId(TestID.ExpandoRow), { stopPropagation: () => undefined })

    expect(screen.getByTestId('position-pool-hidden')).toBeDefined()
  })

  it('shows only open positions under the Open filter', () => {
    renderTab(
      { positions: [position('pool-open', PositionStatus.IN_RANGE), position('pool-closed', PositionStatus.CLOSED)] },
      { statusFilter: PositionStatusFilterValue.Open },
    )

    expect(screen.getByTestId('position-pool-open')).toBeDefined()
    expect(screen.queryByTestId('position-pool-closed')).toBeNull()
  })

  it('shows only closed positions under the Closed filter', () => {
    renderTab(
      { positions: [position('pool-open', PositionStatus.IN_RANGE), position('pool-closed', PositionStatus.CLOSED)] },
      { statusFilter: PositionStatusFilterValue.Closed },
    )

    expect(screen.getByTestId('position-pool-closed')).toBeDefined()
    expect(screen.queryByTestId('position-pool-open')).toBeNull()
  })

  it('sorts closed positions to the end under the All filter', () => {
    renderTab(
      {
        positions: [
          position('pool-closed', PositionStatus.CLOSED),
          position('pool-open-1', PositionStatus.IN_RANGE),
          position('pool-open-2', PositionStatus.OUT_OF_RANGE),
        ],
      },
      { statusFilter: PositionStatusFilterValue.All },
    )

    const rendered = screen
      .getAllByTestId(/^position-/)
      .map((node) => (node as unknown as HTMLElement).getAttribute('data-testid'))
    expect(rendered).toEqual(['position-pool-open-1', 'position-pool-open-2', 'position-pool-closed'])
  })

  it('renders the empty closed view with a CTA that switches back to open positions', () => {
    renderTab(
      { positions: [position('pool-open', PositionStatus.IN_RANGE)] },
      { statusFilter: PositionStatusFilterValue.Closed },
    )

    expect(screen.getByTestId('pools-empty-filter-view')).toBeDefined()
    expect(screen.queryByTestId('position-pool-open')).toBeNull()

    fireEvent.press(screen.getByTestId('pools-empty-filter-view-cta'), { stopPropagation: () => undefined })

    expect(mockOnStatusFilterChange).toHaveBeenCalledWith(PositionStatusFilterValue.Open)
  })
})
