import userEvent from '@testing-library/user-event'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_LP_POSITION_PROTOCOL_FILTER, DEFAULT_LP_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
import { PositionsHeader } from '~/features/Liquidity/PositionsHeader'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [UniverseChainId.Mainnet, UniverseChainId.Base] }),
}))

vi.mock('uniswap/src/components/network/NetworkFilter', () => ({
  NetworkFilter: vi.fn(() => <div data-testid="network-filter" />),
}))

const defaultProps = {
  selectedChain: null,
  selectedVersions: DEFAULT_LP_POSITION_PROTOCOL_FILTER,
  selectedStatus: DEFAULT_LP_POSITION_STATUS_FILTER,
  onChainChange: vi.fn(),
  onVersionChange: vi.fn(),
  onStatusChange: vi.fn(),
}

describe('PositionsHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useFeatureFlag).mockReturnValue(false)
  })

  it('should render the LP title by default', () => {
    render(<PositionsHeader {...defaultProps} />)

    expect(screen.getByText('Your positions')).toBeInTheDocument()
  })

  it('should hide the title and network filter when the parent page owns the action row layout', () => {
    render(<PositionsHeader {...defaultProps} showTitle={false} showNetworkFilter={false} />)

    expect(screen.queryByText('Your positions')).not.toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Protocol')).toBeInTheDocument()
    expect(NetworkFilter).not.toHaveBeenCalled()
    expect(screen.queryByTestId('network-filter')).not.toBeInTheDocument()
  })

  it('should include the parent entry point when navigating to the revamp add-liquidity flow', async () => {
    const user = userEvent.setup()
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.AddLiquidityRevamp)

    render(<PositionsHeader {...defaultProps} createPositionEntryPoint="/portfolio/pools?chain=base" />)

    await user.click(screen.getByRole('button', { name: 'New position' }))

    expect(mockNavigate).toHaveBeenCalledWith('/positions/add?entryPoint=%2Fportfolio%2Fpools%3Fchain%3Dbase')
  })
})
