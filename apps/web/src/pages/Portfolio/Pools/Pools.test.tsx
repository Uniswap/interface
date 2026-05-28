import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { ReactNode } from 'react'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { DEFAULT_LP_POSITION_PROTOCOL_FILTER, DEFAULT_LP_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
import {
  useWalletPositionsWeb,
  type UseWalletPositionsWebResult,
} from '~/features/Liquidity/hooks/useWalletPositionsWeb'
import { PositionsHeader } from '~/features/Liquidity/PositionsHeader'
import { PositionsListSection } from '~/features/Liquidity/PositionsListSection'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'
import { PortfolioPools } from '~/pages/Portfolio/Pools/Pools'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { mocked } from '~/test-utils/mocked'
import { act, render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/hooks/useWalletPositionsWeb', () => ({
  useWalletPositionsWeb: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  default: ({ children, element, logPress }: { children: ReactNode; element?: ElementName; logPress?: boolean }) => (
    <div data-element-name={element} data-log-press={logPress}>
      {children}
    </div>
  ),
}))

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/usePortfolioAddresses', () => ({
  usePortfolioAddresses: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/useResolvedAddresses', () => ({
  useResolvedAddresses: vi.fn(),
}))

vi.mock('uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance', () => ({
  PortfolioBalance: vi.fn(
    ({
      chainIds,
      endText,
      evmOwner,
      part,
    }: {
      chainIds?: UniverseChainId[]
      endText?: ReactNode
      evmOwner?: Address
      part: PortfolioBalancePart
    }) => (
      <div data-chain-ids={chainIds?.join(',')} data-evm-owner={evmOwner} data-part={part}>
        {endText}
      </div>
    ),
  ),
}))

vi.mock('~/features/Liquidity/PositionsHeader', () => ({
  PositionsHeader: vi.fn(({ onVersionChange }: { onVersionChange: (version: ProtocolVersion) => void }) => (
    <button onClick={() => onVersionChange(ProtocolVersion.V4)}>Positions action bar</button>
  )),
}))

vi.mock('~/features/Liquidity/LiquidityPositionCard', () => ({
  LiquidityPositionCardLoader: () => <div data-testid="liquidity-card-loader" />,
}))

vi.mock('~/features/Liquidity/PositionsListSection', () => ({
  PositionsListSection: vi.fn(({ visiblePositions }: { visiblePositions: PositionInfo[] }) => (
    <div data-testid="positions-list">
      {visiblePositions.map((position) => (
        <div key={`${position.poolId}-${position.tokenId}`}>{position.poolId}</div>
      ))}
    </div>
  )),
}))

vi.mock('~/pages/Portfolio/Pools/components/PortfolioPoolsRewardsCard', () => ({
  PortfolioPoolsRewardsCard: () => null,
}))

const MOCK_POSITION = {
  poolId: 'pool-eth-usdc',
  tokenId: '1',
  chainId: UniverseChainId.Mainnet,
  currency0Amount: {
    currency: {
      symbol: 'ETH',
      name: 'Ethereum',
    },
  },
  currency1Amount: {
    currency: {
      symbol: 'USDC',
      name: 'USD Coin',
    },
  },
} as PositionInfo
const MOCK_SVM_ADDRESS = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'

function createWalletPositionsResult(
  overrides: Partial<UseWalletPositionsWebResult> = {},
): UseWalletPositionsWebResult {
  return {
    visiblePositions: [],
    hiddenPositions: [],
    isFetching: false,
    isPlaceholderData: false,
    hasNextPage: false,
    isLoadingPositions: false,
    hasErrorWithoutData: false,
    refetch: vi.fn(),
    loadMorePositions: vi.fn(),
    ...overrides,
  }
}

describe('PortfolioPools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(usePortfolioAddresses).mockReturnValue({
      evmAddress: SAMPLE_SEED_ADDRESS_1,
      svmAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useResolvedAddresses).mockReturnValue({
      evmAddress: SAMPLE_SEED_ADDRESS_1,
      svmAddress: undefined,
      isExternalWallet: false,
    })
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Pools,
      chainId: undefined,
      externalAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult())
  })

  it('should render the empty state after positions load with no visible positions', () => {
    render(<PortfolioPools />)

    expect(screen.getByText('No positions')).toBeInTheDocument()
    expect(screen.getByText(/liquidity positions/)).toBeInTheDocument()
    const explorePoolsLink = screen.getByRole('link', { name: 'Explore pools' })
    const newPositionLink = screen.getByRole('link', { name: 'New position' })

    expect(explorePoolsLink).toHaveAttribute('href', '/explore/pools')
    expect(newPositionLink).toHaveAttribute('href', '/positions/create/v4?entryPoint=%2Fportfolio%2Fpools')
    expect(explorePoolsLink.parentElement).toHaveAttribute(
      'data-element-name',
      ElementName.PositionsEmptyStateExplorePools,
    )
    expect(newPositionLink.parentElement).toHaveAttribute(
      'data-element-name',
      ElementName.PositionsEmptyStateNewPosition,
    )
    expect(PortfolioBalance).not.toHaveBeenCalled()
    expect(PositionsHeader).not.toHaveBeenCalled()
  })

  it('should render the list section when only hidden positions exist, so the hidden expando remains reachable', () => {
    mocked(useWalletPositionsWeb).mockReturnValue(
      createWalletPositionsResult({ visiblePositions: [], hiddenPositions: [MOCK_POSITION] }),
    )

    render(<PortfolioPools />)

    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument()
    expect(PortfolioBalance).toHaveBeenCalled()
    expect(PositionsListSection).toHaveBeenCalled()
  })

  it('should route to the add liquidity flow when the revamp flag is enabled', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.AddLiquidityRevamp)

    render(<PortfolioPools />)

    expect(screen.getByRole('link', { name: 'New position' })).toHaveAttribute(
      'href',
      '/positions/add?entryPoint=%2Fportfolio%2Fpools',
    )
  })

  it('should render the balance header without a position count while positions are loading', () => {
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ isLoadingPositions: true }))

    render(<PortfolioPools />)

    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
    expect(mocked(PortfolioBalance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        evmOwner: SAMPLE_SEED_ADDRESS_1,
        chainIds: undefined,
        endText: undefined,
        part: PortfolioBalancePart.Pools,
      }),
    )
    expect(mocked(PositionsHeader).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        showTitle: false,
        showNetworkFilter: false,
        selectedChain: null,
        selectedVersions: DEFAULT_LP_POSITION_PROTOCOL_FILTER,
        selectedStatus: DEFAULT_LP_POSITION_STATUS_FILTER,
        createPositionEntryPoint: '/portfolio/pools',
      }),
    )
    expect(screen.getByTestId(TestID.PortfolioPoolsSearchInput)).toHaveAttribute('placeholder', 'Search pools')
    expect(screen.getAllByTestId('liquidity-card-loader')).toHaveLength(5)
  })

  it('should render the pools unavailable state for SVM-only wallets', () => {
    mocked(usePortfolioAddresses).mockReturnValue({
      evmAddress: undefined,
      svmAddress: MOCK_SVM_ADDRESS,
      isExternalWallet: false,
    })
    mocked(useResolvedAddresses).mockReturnValue({
      evmAddress: undefined,
      svmAddress: MOCK_SVM_ADDRESS,
      isExternalWallet: false,
    })

    render(<PortfolioPools />)

    expect(useWalletPositionsWeb).toHaveBeenCalledWith({
      address: undefined,
      chainFilter: null,
      versionFilter: DEFAULT_LP_POSITION_PROTOCOL_FILTER,
      statusFilter: DEFAULT_LP_POSITION_STATUS_FILTER,
    })
    expect(screen.getByText('Pools aren’t available on Solana')).toBeInTheDocument()
    expect(screen.getByText('Connect an Ethereum wallet to view your pools')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Ethereum wallet' })).toBeInTheDocument()
    expect(screen.queryByText('Providing liquidity on different protocols')).not.toBeInTheDocument()
    expect(screen.queryByText('Hooks on v4')).not.toBeInTheDocument()
    expect(PortfolioBalance).not.toHaveBeenCalled()
    expect(PositionsHeader).not.toHaveBeenCalled()
    expect(screen.queryByTestId(TestID.PortfolioPoolsSearchInput)).not.toBeInTheDocument()
    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
  })

  it('should use demo wallet data instead of the missing EVM wallet view when fully disconnected', () => {
    mocked(useResolvedAddresses).mockReturnValue({
      evmAddress: undefined,
      svmAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))

    render(<PortfolioPools />)

    expect(useWalletPositionsWeb).toHaveBeenCalledWith({
      address: SAMPLE_SEED_ADDRESS_1,
      chainFilter: null,
      versionFilter: DEFAULT_LP_POSITION_PROTOCOL_FILTER,
      statusFilter: DEFAULT_LP_POSITION_STATUS_FILTER,
    })
    expect(screen.queryByText('Pools aren’t available on Solana')).not.toBeInTheDocument()
    expect(mocked(PortfolioBalance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        evmOwner: SAMPLE_SEED_ADDRESS_1,
        part: PortfolioBalancePart.Pools,
      }),
    )
    expect(screen.getByText('1 position')).toBeInTheDocument()
    expect(mocked(PositionsHeader).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        showTitle: false,
        showNetworkFilter: false,
        createPositionEntryPoint: '/portfolio/pools',
      }),
    )
    expect(screen.getByTestId(TestID.PortfolioPoolsSearchInput)).toHaveAttribute('placeholder', 'Search pools')
  })

  it('should not render the empty state when positions are present', () => {
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))

    render(<PortfolioPools />)

    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
    expect(mocked(PortfolioBalance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        evmOwner: SAMPLE_SEED_ADDRESS_1,
        chainIds: undefined,
        part: PortfolioBalancePart.Pools,
      }),
    )
    expect(screen.getByText('1 position')).toBeInTheDocument()
    expect(mocked(PositionsHeader).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        showTitle: false,
        showNetworkFilter: false,
        createPositionEntryPoint: '/portfolio/pools',
      }),
    )
    expect(screen.getByTestId(TestID.PortfolioPoolsSearchInput)).toHaveAttribute('placeholder', 'Search pools')
    expect(mocked(PositionsListSection).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        visiblePositions: [MOCK_POSITION],
        hiddenPositions: [],
        hasNextPage: false,
        isFetching: false,
        isPlaceholderData: false,
      }),
    )
  })

  it('should pass the selected chain to the positions query', () => {
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Pools,
      chainId: UniverseChainId.Base,
      externalAddress: undefined,
      isExternalWallet: false,
    })

    render(<PortfolioPools />)

    expect(useWalletPositionsWeb).toHaveBeenCalledWith({
      address: SAMPLE_SEED_ADDRESS_1,
      chainFilter: UniverseChainId.Base,
      versionFilter: DEFAULT_LP_POSITION_PROTOCOL_FILTER,
      statusFilter: DEFAULT_LP_POSITION_STATUS_FILTER,
    })
    expect(PortfolioBalance).not.toHaveBeenCalled()
    expect(PositionsHeader).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'New position' })).toHaveAttribute(
      'href',
      '/positions/create/v4?entryPoint=%2Fportfolio%2Fpools%3Fchain%3Dbase',
    )
  })

  it('should pass the selected chain to the balance header when positions are present', () => {
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Pools,
      chainId: UniverseChainId.Base,
      externalAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))

    render(<PortfolioPools />)

    expect(mocked(PortfolioBalance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        evmOwner: SAMPLE_SEED_ADDRESS_1,
        chainIds: [UniverseChainId.Base],
        part: PortfolioBalancePart.Pools,
      }),
    )
    expect(screen.getByText('1 position')).toBeInTheDocument()
    expect(mocked(PositionsHeader).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        showTitle: false,
        selectedChain: null,
        createPositionEntryPoint: '/portfolio/pools?chain=base',
      }),
    )
  })

  it('should render no results instead of the full empty state when filters hide all positions', async () => {
    mocked(useWalletPositionsWeb).mockImplementation(({ versionFilter }) =>
      createWalletPositionsResult({
        visiblePositions: versionFilter.includes(ProtocolVersion.V4) ? [MOCK_POSITION] : [],
      }),
    )

    render(<PortfolioPools />)

    await act(async () => {
      mocked(PositionsHeader).mock.calls[0]?.[0].onVersionChange(ProtocolVersion.V4)
    })

    expect(screen.getByText('No results found.')).toBeInTheDocument()
    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
    expect(PortfolioBalance).toHaveBeenCalled()
  })

  it('should render an error view with retry when positions fail before data loads', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ hasErrorWithoutData: true, refetch }))

    render(<PortfolioPools />)

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
  })
})
