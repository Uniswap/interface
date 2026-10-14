import { Text } from '@universe/mycelium'
import { ActivityTab } from 'src/app/components/tabs/ActivityTab'
import { fireEvent, render, screen } from 'src/test/test-utils'
import type { MockedFunction } from 'vitest'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

vi.mock('wallet/src/features/activity/useActivityDataWallet', () => ({
  useActivityDataWallet: vi.fn(),
}))

// jsdom has no layout, so the real virtualizer measures a zero-height viewport and renders no rows.
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  UniversalList: (await import('@universe/mycelium/testing')).UniversalListTestDouble,
}))

vi.mock('uniswap/src/features/dataApi/outage/DataApiOutageModalContent', () => ({
  DataApiOutageModalContent: ({
    isOpen,
    lastUpdatedAt,
    onClose,
  }: {
    isOpen: boolean
    lastUpdatedAt?: number
    onClose: () => void
  }): JSX.Element | null =>
    isOpen ? (
      <div>
        <span>{`outage-modal-${lastUpdatedAt}`}</span>
        <button onClick={onClose}>close-outage-modal</button>
      </div>
    ) : null,
}))

const mockUseActivityDataWallet = useActivityDataWallet as MockedFunction<typeof useActivityDataWallet>
const localActivityItem = { id: 'local-transaction' } as never

const baseResult = {
  maybeEmptyComponent: null,
  renderActivityItem: ({ item }: { item: { id: string } }) => <Text key={item.id}>{item.id}</Text>,
  sectionData: [localActivityItem],
  keyExtractor: (item: { id: string }) => item.id,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  isLoading: false,
  isFetching: false,
  refetch: vi.fn(),
  error: undefined,
  dataUpdatedAt: 1710000000000,
} as unknown as ReturnType<typeof useActivityDataWallet>

describe('ActivityTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an interactive outage banner while keeping local activity visible when remote history fails', () => {
    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      error: new Error('ListTransactions failed'),
    })

    render(<ActivityTab address="0xabc" canShowOutageBanner />)

    expect(screen.getByText('Cannot load recent activity')).toBeDefined()
    expect(screen.getByText('local-transaction')).toBeDefined()

    fireEvent.click(screen.getByText('Cannot load recent activity'))

    expect(screen.getByText('outage-modal-1710000000000')).toBeDefined()
  })

  it('still shows the outage banner when the outage left no activity to display', () => {
    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      sectionData: [],
      maybeEmptyComponent: <Text>no-activity-yet</Text>,
      error: new Error('ListTransactions failed'),
    })

    render(<ActivityTab address="0xabc" canShowOutageBanner />)

    // Previously the empty state replaced the whole tree, hiding the banner in exactly the case
    // that produced it.
    expect(screen.getByText('Cannot load recent activity')).toBeDefined()
    expect(screen.getByText('no-activity-yet')).toBeDefined()
  })

  it('does not show the outage banner when fetching an older page fails', () => {
    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      error: new Error('ListTransactions next page failed'),
      isFetchNextPageError: true,
    })

    render(<ActivityTab address="0xabc" canShowOutageBanner />)

    expect(screen.queryByText('Cannot load recent activity')).toBeNull()
    expect(screen.getByText('local-transaction')).toBeDefined()
  })

  it('does not show the outage banner when the host does not permit it', () => {
    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      error: new Error('ListTransactions failed'),
    })

    render(<ActivityTab address="0xabc" canShowOutageBanner={false} />)

    expect(screen.queryByText('Cannot load recent activity')).toBeNull()
    expect(screen.getByText('local-transaction')).toBeDefined()
  })

  it('defaults to hiding the outage banner when the host omits the flag', () => {
    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      error: new Error('ListTransactions failed'),
    })

    render(<ActivityTab address="0xabc" />)

    expect(screen.queryByText('Cannot load recent activity')).toBeNull()
    expect(screen.getByText('local-transaction')).toBeDefined()
  })

  it('keeps the modal open through recovery and does not reopen it after close', () => {
    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      error: new Error('ListTransactions failed'),
    })

    const { rerender } = render(<ActivityTab address="0xabc" canShowOutageBanner />)

    fireEvent.click(screen.getByText('Cannot load recent activity'))
    expect(screen.getByText('outage-modal-1710000000000')).toBeDefined()

    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      maybeEmptyComponent: <Text>no-activity</Text>,
      sectionData: [],
    })
    rerender(<ActivityTab address="0xdef" canShowOutageBanner />)

    expect(screen.queryByText('Cannot load recent activity')).toBeNull()
    expect(screen.getByText('no-activity')).toBeDefined()
    expect(screen.getByText('outage-modal-1710000000000')).toBeDefined()

    fireEvent.click(screen.getByText('close-outage-modal'))
    expect(screen.queryByText('outage-modal-1710000000000')).toBeNull()

    mockUseActivityDataWallet.mockReturnValue({
      ...baseResult,
      error: new Error('ListTransactions failed'),
    })
    rerender(<ActivityTab address="0x123" canShowOutageBanner />)

    expect(screen.getByText('Cannot load recent activity')).toBeDefined()
    expect(screen.queryByText('outage-modal-1710000000000')).toBeNull()
  })

  it('does not show the outage banner when remote history succeeds', () => {
    mockUseActivityDataWallet.mockReturnValue(baseResult)

    render(<ActivityTab address="0xabc" canShowOutageBanner />)

    expect(screen.queryByText('Cannot load recent activity')).toBeNull()
    expect(screen.getByText('local-transaction')).toBeDefined()
  })
})
