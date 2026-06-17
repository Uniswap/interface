import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { makeMutable } from 'react-native-reanimated'
import { HomeScreenPoolsTab } from 'src/screens/HomeScreen/portfolio/tabs/pools/HomeScreenPoolsTab'
import type { PoolsListRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { render, screen } from 'src/test/test-utils'

jest.mock('uniswap/src/components/portfolio/PositionItem/PositionItem', () => ({
  PositionItem: ({ positionInfo }: { positionInfo: { poolId: string } }) => {
    const { Text } = jest.requireActual('ui/src')
    return <Text testID={`position-${positionInfo.poolId}`}>{positionInfo.poolId}</Text>
  },
}))

const noop = (): void => undefined

const baseData: PoolsListRenderData = {
  positions: [],
  hasData: true,
  error: null,
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  refetch: noop,
  onListEndReached: noop,
}

const position = (poolId: string, status: PositionStatus = PositionStatus.IN_RANGE): never =>
  ({ poolId, tokenId: 't', chainId: 1, status }) as never

const renderTab = (overrides: Partial<PoolsListRenderData> = {}, shouldLoadPools = true): void => {
  render(
    <HomeScreenPoolsTab
      bodyOffsetY={0}
      poolsListRenderData={{ ...baseData, ...overrides }}
      feedScrollValue={makeMutable(0)}
      shouldLoadPools={shouldLoadPools}
      viewportHeight={800}
      onHeightChange={noop}
    />,
  )
}

describe('HomeScreenPoolsTab', () => {
  it('renders the loading skeleton while the first page loads (no data)', () => {
    renderTab({ isFetching: true, hasData: false })

    expect(screen.getByTestId('pools-loading-skeleton')).toBeDefined()
    expect(screen.queryByTestId('position-pool-a')).toBeNull()
  })

  it('does not render rows until the tab has been visited', () => {
    renderTab({ positions: [position('pool-a')] }, false)

    expect(screen.queryByTestId('position-pool-a')).toBeNull()
    expect(screen.queryByTestId('pools-loading-skeleton')).toBeNull()
  })

  it('renders position rows once data is available', () => {
    renderTab({ positions: [position('pool-a'), position('pool-b')] })

    expect(screen.getByTestId('position-pool-a')).toBeDefined()
    expect(screen.getByTestId('position-pool-b')).toBeDefined()
    expect(screen.queryByTestId('pools-loading-skeleton')).toBeNull()
  })
})
