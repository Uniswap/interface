import { useWindowVirtualizer } from '@tanstack/react-virtual'
import userEvent from '@testing-library/user-event'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { PositionsListSection } from '~/pages/Positions/components/PositionsListSection'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: vi.fn(),
}))

vi.mock('~/features/Liquidity/LiquidityPositionCard', () => ({
  LiquidityPositionCard: ({ liquidityPosition }: { liquidityPosition: PositionInfo }) => (
    <div data-testid="liquidity-card">{`${liquidityPosition.poolId}-${liquidityPosition.tokenId}`}</div>
  ),
  LiquidityPositionCardLoader: () => <div data-testid="liquidity-card-loader" />,
}))

vi.mock('~/pages/Positions/ExpandoRow', () => ({
  ExpandoRow: ({
    isExpanded,
    toggle,
    numItems,
    children,
  }: {
    isExpanded: boolean
    toggle: () => void
    numItems: number
    children: React.ReactNode
  }) => (
    <div data-testid="expando-row">
      <button data-testid="expando-toggle" onClick={toggle}>{`expanded=${isExpanded}, items=${numItems}`}</button>
      {isExpanded && <div data-testid="expando-body">{children}</div>}
    </div>
  ),
}))

const positionInfo = (id: string): PositionInfo =>
  ({
    poolId: `pool-${id}`,
    tokenId: id,
    chainId: UniverseChainId.Mainnet,
  }) as PositionInfo

function setVirtualItems(positions: PositionInfo[], lastIndex?: number) {
  const items =
    lastIndex === undefined
      ? positions.map((_, index) => ({ index, size: 200, start: index * 200, end: (index + 1) * 200 }))
      : Array.from({ length: lastIndex + 1 }, (_, index) => ({
          index,
          size: 200,
          start: index * 200,
          end: (index + 1) * 200,
        }))
  mocked(useWindowVirtualizer).mockReturnValue({
    getVirtualItems: () => items,
    getTotalSize: () => positions.length * 200,
    options: { scrollMargin: 0 },
  } as unknown as ReturnType<typeof useWindowVirtualizer>)
}

const baseProps = {
  visiblePositions: [positionInfo('a'), positionInfo('b')],
  hiddenPositions: [positionInfo('h1'), positionInfo('h2'), positionInfo('h3')],
  hasNextPage: false,
  isFetching: false,
  isPlaceholderData: false,
  loadMorePositions: vi.fn(),
  showHiddenPositions: false,
  setShowHiddenPositions: vi.fn(),
}

describe('PositionsListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setVirtualItems(baseProps.visiblePositions)
  })

  it('renders one liquidity card per visible virtual item', () => {
    render(<PositionsListSection {...baseProps} />)

    expect(screen.getAllByTestId('liquidity-card')).toHaveLength(2)
    expect(screen.getByText('pool-a-a')).toBeInTheDocument()
    expect(screen.getByText('pool-b-b')).toBeInTheDocument()
  })

  it('passes hidden count to ExpandoRow', () => {
    render(<PositionsListSection {...baseProps} />)

    expect(screen.getByTestId('expando-toggle')).toHaveTextContent('expanded=false, items=3')
  })

  it('invokes setShowHiddenPositions(!current) when ExpandoRow toggle is pressed', async () => {
    const user = userEvent.setup()
    const setShowHiddenPositions = vi.fn()
    render(
      <PositionsListSection
        {...baseProps}
        showHiddenPositions={false}
        setShowHiddenPositions={setShowHiddenPositions}
      />,
    )

    await user.click(screen.getByTestId('expando-toggle'))

    expect(setShowHiddenPositions).toHaveBeenCalledWith(true)
  })

  it('reflects showHiddenPositions=true by rendering the expando body', () => {
    render(<PositionsListSection {...baseProps} showHiddenPositions={true} />)

    expect(screen.getByTestId('expando-body')).toBeInTheDocument()
    expect(screen.getByTestId('expando-toggle')).toHaveTextContent('expanded=true, items=3')
  })

  it('calls loadMorePositions when the last visible item is within 3 of the end and hasNextPage and !isFetching', () => {
    const positions = Array.from({ length: 10 }, (_, i) => positionInfo(`p${i}`))
    setVirtualItems(positions, /* lastIndex */ 8) // 8 >= 10 - 3 = 7

    const loadMorePositions = vi.fn()
    render(
      <PositionsListSection
        {...baseProps}
        visiblePositions={positions}
        hasNextPage={true}
        isFetching={false}
        loadMorePositions={loadMorePositions}
      />,
    )

    expect(loadMorePositions).toHaveBeenCalledTimes(1)
  })

  it('does NOT call loadMorePositions when isFetching is true', () => {
    const positions = Array.from({ length: 10 }, (_, i) => positionInfo(`p${i}`))
    setVirtualItems(positions, 8)

    const loadMorePositions = vi.fn()
    render(
      <PositionsListSection
        {...baseProps}
        visiblePositions={positions}
        hasNextPage={true}
        isFetching={true}
        loadMorePositions={loadMorePositions}
      />,
    )

    expect(loadMorePositions).not.toHaveBeenCalled()
  })

  it('does NOT call loadMorePositions when hasNextPage is false', () => {
    const positions = Array.from({ length: 10 }, (_, i) => positionInfo(`p${i}`))
    setVirtualItems(positions, 8)

    const loadMorePositions = vi.fn()
    render(
      <PositionsListSection
        {...baseProps}
        visiblePositions={positions}
        hasNextPage={false}
        isFetching={false}
        loadMorePositions={loadMorePositions}
      />,
    )

    expect(loadMorePositions).not.toHaveBeenCalled()
  })

  it('renders the loading-more footer when isFetching and hasNextPage', () => {
    render(<PositionsListSection {...baseProps} isFetching={true} hasNextPage={true} />)

    expect(screen.getByText('Loading more positions...')).toBeInTheDocument()
  })

  it('hides the loading-more footer when !isFetching', () => {
    render(<PositionsListSection {...baseProps} isFetching={false} hasNextPage={true} />)

    expect(screen.queryByText('Loading more positions...')).not.toBeInTheDocument()
  })

  it('hides the loading-more footer when !hasNextPage', () => {
    render(<PositionsListSection {...baseProps} isFetching={true} hasNextPage={false} />)

    expect(screen.queryByText('Loading more positions...')).not.toBeInTheDocument()
  })
})
