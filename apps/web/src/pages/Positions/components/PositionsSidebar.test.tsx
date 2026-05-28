import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PositionsSidebar } from '~/pages/Positions/components/PositionsSidebar'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/Positions/TopPools', () => ({
  TopPools: ({ chainId }: { chainId: UniverseChainId | null }) => (
    <div data-testid="top-pools-mock">{chainId === null ? 'all-chains' : `chain-${chainId}`}</div>
  ),
}))

describe('PositionsSidebar', () => {
  it('always renders TopPools with the provided chainFilter', () => {
    render(<PositionsSidebar chainFilter={UniverseChainId.Mainnet} isConnected={false} />)

    expect(screen.getByTestId('top-pools-mock')).toHaveTextContent(`chain-${UniverseChainId.Mainnet}`)
  })

  it('renders TopPools with all-chains marker when chainFilter is null', () => {
    render(<PositionsSidebar chainFilter={null} isConnected={false} />)

    expect(screen.getByTestId('top-pools-mock')).toHaveTextContent('all-chains')
  })

  it('hides the learn-more block when isConnected is false', () => {
    render(<PositionsSidebar chainFilter={null} isConnected={false} />)

    expect(screen.queryByText('Learn about liquidity provision')).not.toBeInTheDocument()
  })

  it('shows the learn-more block when isConnected is true', () => {
    render(<PositionsSidebar chainFilter={null} isConnected={true} />)

    expect(screen.getByText('Learn about liquidity provision')).toBeInTheDocument()
  })
})
