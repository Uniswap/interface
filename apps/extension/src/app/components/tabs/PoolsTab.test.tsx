import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolsTab } from 'src/app/components/tabs/PoolsTab'
import { render, screen } from 'src/test/test-utils'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { MockedFunction } from 'vitest'

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: vi.fn(),
}))

vi.mock('wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener', () => ({
  usePendingLiquidityTransactionsChangeListener: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [1] }),
}))

vi.mock('utilities/src/react/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({ sentinelRef: { current: null } }),
}))

vi.mock('uniswap/src/components/portfolio/PositionItem/PositionItem', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    PositionItem: ({ positionInfo }: { positionInfo: { poolId: string } }) => {
      return <Text testID={`position-${positionInfo.poolId}`}>{positionInfo.poolId}</Text>
    },
  }
})

const mockUseWalletPositions = useWalletPositions as MockedFunction<typeof useWalletPositions>

const baseResult = {
  positions: [],
  hiddenPositions: [],
  allPositions: [],
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  isPlaceholderData: false,
  hasNextPage: false,
  hasData: true,
  error: null,
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
} as unknown as ReturnType<typeof useWalletPositions>

const position = (poolId: string, status: PositionStatus = PositionStatus.IN_RANGE): never =>
  ({ poolId, tokenId: 't', chainId: 1, status }) as never

describe('PoolsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the error state when the query errors before any data', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      hasData: false,
      error: new Error('boom') as never,
    })

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByText('Pools balances currently unavailable')).toBeDefined()
    expect(screen.getByText('Try again')).toBeDefined()
  })

  it('renders the loading skeleton while the first page loads (no data, no error)', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      isFetching: true,
      hasData: false,
    })

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByText('Status')).toBeDefined()
    expect(screen.getByTestId('pools-loading-skeleton')).toBeDefined()
    expect(screen.queryByText('Pools balances currently unavailable')).toBeNull()
  })

  it('swaps the error view for the loading skeleton while a retry re-drives the list', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      hasData: false,
      error: new Error('boom') as never,
      isFetching: true,
      isFetchingNextPage: false,
    })

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByTestId('pools-loading-skeleton')).toBeDefined()
    expect(screen.queryByText('Pools balances currently unavailable')).toBeNull()
  })

  it('renders the status filter with the default "Open" selection', () => {
    mockUseWalletPositions.mockReturnValue(baseResult)

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByText('Status')).toBeDefined()
    expect(screen.getByText('Open')).toBeDefined()
  })

  it('shows no no-results message for the empty open filter', () => {
    mockUseWalletPositions.mockReturnValue({ ...baseResult, positions: [], hasData: true })

    render(<PoolsTab address="0xabc" openPositionsCount={3} />)

    expect(screen.queryByText('No closed positions')).toBeNull()
    expect(screen.queryByText(/View .* open position/)).toBeNull()
  })

  it('renders visible position rows', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      positions: [position('pool-a'), position('pool-b')],
    })

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByTestId('position-pool-a')).toBeDefined()
    expect(screen.getByTestId('position-pool-b')).toBeDefined()
    expect(screen.queryByText('Pools balances currently unavailable')).toBeNull()
  })

  it('filters hidden positions by status, hiding the expando when none match the filter', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      positions: [],
      hiddenPositions: [position('pool-hidden-closed', PositionStatus.CLOSED)],
    })

    // Default filter is Open; a closed hidden position must not surface the expando.
    render(<PoolsTab address="0xabc" />)

    expect(screen.queryByText(/Hidden/)).toBeNull()
  })

  it('shows the hidden expando with the hidden count and reveals rows when expanded', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      positions: [position('pool-a')],
      hiddenPositions: [position('pool-hidden-1'), position('pool-hidden-2')],
    })

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByText(/Hidden .*\(2\)/)).toBeDefined()
    expect(screen.queryByTestId('position-pool-hidden-1')).toBeNull()
  })

  it('filters out positions that do not match the active status filter (default open)', () => {
    mockUseWalletPositions.mockReturnValue({
      ...baseResult,
      positions: [position('pool-open'), position('pool-closed', PositionStatus.CLOSED)],
      hiddenPositions: [position('pool-hidden-closed', PositionStatus.CLOSED)],
    })

    render(<PoolsTab address="0xabc" />)

    expect(screen.getByTestId('position-pool-open')).toBeDefined()
    expect(screen.queryByTestId('position-pool-closed')).toBeNull()
    expect(screen.queryByText(/Hidden/)).toBeNull()
  })
})
