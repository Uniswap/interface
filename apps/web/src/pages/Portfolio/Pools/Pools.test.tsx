import userEvent from '@testing-library/user-event'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import type { ReactNode } from 'react'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/assets/constants'
import {
  DEFAULT_LP_POSITION_STATUS_FILTER,
  DEFAULT_V2_POSITION_STATUS_FILTER,
  LP_POSITION_PROTOCOL_VERSIONS,
  V2_POSITION_STATUS_OPTIONS,
  type V2PositionStatusFilter,
} from '~/features/Liquidity/constants'
import { useV2StatusFilter } from '~/features/Liquidity/hooks/useV2StatusFilter'
import {
  useWalletPositionsWeb,
  type UseWalletPositionsWebResult,
} from '~/features/Liquidity/hooks/useWalletPositionsWeb'
import { PositionsSummaryChips } from '~/features/Liquidity/PositionsSummaryChips'
import { PositionsTable } from '~/features/Liquidity/PositionsTable'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { PortfolioPools } from '~/pages/Portfolio/Pools/Pools'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { mocked } from '~/test-utils/mocked'
import { act, render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/hooks/useWalletPositionsWeb', () => ({
  useWalletPositionsWeb: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/balances/usePortfolioBalancePart', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/balances/usePortfolioBalancePart')>()),
  usePortfolioBalancePart: vi.fn(),
}))

vi.mock('~/features/Liquidity/hooks/useV2StatusFilter', () => ({
  useV2StatusFilter: vi.fn(),
}))

vi.mock('~/features/Liquidity/PositionsSummaryChips', () => ({
  PositionsSummaryChips: vi.fn(() => <div data-testid="positions-summary-chips" />),
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => {
  const Trace = ({
    children,
    element,
    logPress,
  }: {
    children: ReactNode
    element?: ElementName
    logPress?: boolean
  }) => (
    <div data-element-name={element} data-log-press={logPress}>
      {children}
    </div>
  )
  return { default: Trace, Trace }
})

vi.mock('~/pages/Portfolio/Header/hooks/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/usePortfolioAddresses', () => ({
  usePortfolioAddresses: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/useResolvedAddresses', () => ({
  useResolvedAddresses: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/useShowDemoView', () => ({
  useShowDemoView: vi.fn(),
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

vi.mock('~/features/Liquidity/PositionsTable', () => ({
  PositionsTable: vi.fn(
    ({ visiblePositions, hiddenPositions }: { visiblePositions: PositionInfo[]; hiddenPositions: PositionInfo[] }) => (
      <div data-testid="positions-table">
        {[...visiblePositions, ...hiddenPositions].map((position) => (
          <div key={`${position.poolId}-${position.tokenId}`}>{position.poolId}</div>
        ))}
      </div>
    ),
  ),
  PositionsTableLoader: vi.fn(() => <div data-testid="positions-table-loader" />),
  PositionsTableError: vi.fn(() => <div data-testid="positions-table-error" />),
}))

const MOCK_POSITION = {
  poolId: 'pool-eth-usdc',
  tokenId: '1',
  chainId: UniverseChainId.Mainnet,
  status: PositionStatus.IN_RANGE,
  version: ProtocolVersion.V3,
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

function makePosition(overrides: Partial<PositionInfo>): PositionInfo {
  return { ...MOCK_POSITION, ...overrides } as PositionInfo
}

function mockTotalPoolsCount(count: number | undefined): void {
  mocked(usePortfolioBalancePart).mockReturnValue({
    data:
      count === undefined
        ? undefined
        : { balanceUSD: undefined, percentChange: undefined, absoluteChangeUSD: undefined, count },
  } as ReturnType<typeof usePortfolioBalancePart>)
}

function mockV2StatusFilter(statuses: V2PositionStatusFilter[]): void {
  mocked(useV2StatusFilter).mockReturnValue({
    v2StatusFilter: statuses,
    toggleV2Status: vi.fn(),
    resetV2Status: vi.fn(),
  })
}

// Loaded balance with the `count` field omitted: verifies the "-" placeholder renders.
function mockBalanceLoadedWithoutCount(): void {
  mocked(usePortfolioBalancePart).mockReturnValue({
    data: { balanceUSD: undefined, percentChange: undefined, absoluteChangeUSD: undefined, count: undefined },
  } as ReturnType<typeof usePortfolioBalancePart>)
}

function enablePoolsBalances(): void {
  mocked(useFeatureFlagWithExposureLoggingDisabled).mockImplementation(
    (flag) => flag === FeatureFlags.PortfolioPoolsBalances,
  )
}

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
    pagesLoaded: 1,
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
    mocked(useShowDemoView).mockReturnValue(false)
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Pools,
      chainId: undefined,
      externalAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useFeatureFlagWithExposureLoggingDisabled).mockReturnValue(false)
    mockV2StatusFilter([...DEFAULT_V2_POSITION_STATUS_FILTER])
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult())
    mockTotalPoolsCount(0)
  })

  it('should render the empty state after positions load with no visible positions', () => {
    render(<PortfolioPools />)

    expect(screen.getByText('No positions')).toBeInTheDocument()
    expect(screen.getByText(/liquidity positions/)).toBeInTheDocument()
    const explorePoolsLink = screen.getByRole('link', { name: 'Explore pools' })
    const newPositionLink = screen.getByRole('link', { name: 'New position' })

    expect(explorePoolsLink).toHaveAttribute('href', '/explore/pools')
    expect(newPositionLink).toHaveAttribute('href', '/positions/add?entryPoint=%2Fportfolio%2Fpools')
    expect(explorePoolsLink.parentElement).toHaveAttribute(
      'data-element-name',
      ElementName.PositionsEmptyStateExplorePools,
    )
    expect(newPositionLink.parentElement).toHaveAttribute(
      'data-element-name',
      ElementName.PositionsEmptyStateNewPosition,
    )
    expect(PortfolioBalance).not.toHaveBeenCalled()
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

    // Version stays client-side; status and search filter server-side via GetWalletPositions.
    expect(useWalletPositionsWeb).toHaveBeenCalledWith({
      address: undefined,
      chainFilter: null,
      versionFilter: LP_POSITION_PROTOCOL_VERSIONS,
      statusFilter: DEFAULT_LP_POSITION_STATUS_FILTER,
      v2StatusFilter: DEFAULT_V2_POSITION_STATUS_FILTER,
      searchText: '',
      sort: { field: 'liquidity', direction: 'desc' },
    })
    expect(screen.getByText('Pools aren’t available on Solana')).toBeInTheDocument()
    expect(screen.getByText('Connect an Ethereum wallet to view your pools')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Ethereum wallet' })).toBeInTheDocument()
    expect(PortfolioBalance).not.toHaveBeenCalled()
    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
  })

  it('should render the table loader with the balance header while positions load', () => {
    enablePoolsBalances()
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ isLoadingPositions: true }))
    mockTotalPoolsCount(undefined)

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
    expect(screen.getByTestId('positions-summary-chips')).toBeInTheDocument()
    expect(screen.getByTestId('positions-table-loader')).toBeInTheDocument()
  })

  it('should render the positions table when positions are present', () => {
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))
    mockTotalPoolsCount(1)

    render(<PortfolioPools />)

    expect(screen.queryByText('No positions')).not.toBeInTheDocument()
    expect(screen.getByTestId('positions-table')).toBeInTheDocument()
    expect(mocked(PositionsTable).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        visiblePositions: [MOCK_POSITION],
        hiddenPositions: [],
        hasNextPage: false,
        isFetching: false,
        isPlaceholderData: false,
        entryPoint: '/portfolio/pools',
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
      versionFilter: LP_POSITION_PROTOCOL_VERSIONS,
      statusFilter: DEFAULT_LP_POSITION_STATUS_FILTER,
      v2StatusFilter: DEFAULT_V2_POSITION_STATUS_FILTER,
      searchText: '',
      sort: { field: 'liquidity', direction: 'desc' },
    })
  })

  it('should pass the selected chain to the balance header when positions are present', () => {
    enablePoolsBalances()
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Pools,
      chainId: UniverseChainId.Base,
      externalAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))
    mockTotalPoolsCount(1)

    render(<PortfolioPools />)

    expect(mocked(PortfolioBalance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        evmOwner: SAMPLE_SEED_ADDRESS_1,
        chainIds: [UniverseChainId.Base],
        part: PortfolioBalancePart.Pools,
      }),
    )
    expect(screen.getByText('1 position')).toBeInTheDocument()
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

  describe('positions table state', () => {
    it('keeps the positions table mounted (no discovery empty state) when only hidden positions exist', () => {
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({ visiblePositions: [], hiddenPositions: [MOCK_POSITION] }),
      )
      mockTotalPoolsCount(1)

      render(<PortfolioPools />)

      expect(screen.queryByText('No positions')).not.toBeInTheDocument()
      expect(screen.getByTestId('positions-table')).toBeInTheDocument()
      expect(mocked(PositionsTable).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ visiblePositions: [], hiddenPositions: [MOCK_POSITION] }),
      )
    })

    it('shows the discovery empty state only when the wallet has no positions at all', () => {
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({ visiblePositions: [], hiddenPositions: [] }),
      )
      mockTotalPoolsCount(0)

      render(<PortfolioPools />)

      expect(screen.getByText('No positions')).toBeInTheDocument()
      expect(screen.queryByTestId('positions-table')).not.toBeInTheDocument()
    })

    it('keeps the table mounted and marks the route chain as an active filter when it empties the list', () => {
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Pools,
        chainId: UniverseChainId.Base,
        externalAddress: undefined,
        isExternalWallet: false,
      })
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({ visiblePositions: [], hiddenPositions: [] }),
      )
      mockTotalPoolsCount(0)

      render(<PortfolioPools />)

      expect(screen.queryByText('No positions')).not.toBeInTheDocument()
      expect(screen.getByTestId('positions-table')).toBeInTheDocument()
      expect(mocked(PositionsTable).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ chainFilter: UniverseChainId.Base }),
      )
    })

    it('wires onClearFilters into the table so the empty-state clear action can recover the list', () => {
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({ visiblePositions: [MOCK_POSITION], hiddenPositions: [] }),
      )
      mockTotalPoolsCount(1)

      render(<PortfolioPools />)

      expect(mocked(PositionsTable).mock.calls[0]?.[0].onClearFilters).toBeInstanceOf(Function)
    })
  })

  describe('position count', () => {
    it('renders the balance header above the summary chips with the backend open count', () => {
      enablePoolsBalances()
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({
          visiblePositions: [
            makePosition({ poolId: 'open-a', tokenId: 'a', status: PositionStatus.IN_RANGE }),
            makePosition({ poolId: 'open-b', tokenId: 'b', status: PositionStatus.OUT_OF_RANGE }),
          ],
        }),
      )
      mockTotalPoolsCount(5)

      render(<PortfolioPools />)

      expect(mocked(PortfolioBalance).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          evmOwner: SAMPLE_SEED_ADDRESS_1,
          part: PortfolioBalancePart.Pools,
        }),
      )
      expect(screen.getByTestId('positions-summary-chips')).toBeInTheDocument()
      // The count mirrors the balance's backend open count, not the loaded rows.
      expect(screen.getByText('5 positions')).toBeInTheDocument()
      expect(screen.queryByText('2 positions')).not.toBeInTheDocument()
    })

    it('keeps the chips-only layout when portfolio pools balances is off', () => {
      mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))
      mockTotalPoolsCount(1)

      render(<PortfolioPools />)

      expect(PortfolioBalance).not.toHaveBeenCalled()
      expect(screen.getByTestId('positions-summary-chips')).toBeInTheDocument()
    })

    it('adds the loaded closed rows to the backend open count once the Closed lifecycle is selected', () => {
      enablePoolsBalances()
      mockV2StatusFilter([...V2_POSITION_STATUS_OPTIONS])
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({
          visiblePositions: [
            makePosition({ poolId: 'open-a', tokenId: 'a', status: PositionStatus.IN_RANGE }),
            makePosition({ poolId: 'closed-a', tokenId: 'c', status: PositionStatus.CLOSED }),
          ],
        }),
      )
      mockTotalPoolsCount(4)

      render(<PortfolioPools />)

      expect(screen.getByText('5 positions')).toBeInTheDocument()
      expect(screen.queryByText('4 positions')).not.toBeInTheDocument()
    })

    it('keeps the backend open base and adds loaded closed rows under a closed-only filter', () => {
      enablePoolsBalances()
      mockV2StatusFilter(['closed'])
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({
          visiblePositions: [makePosition({ poolId: 'closed-a', tokenId: 'c', status: PositionStatus.CLOSED })],
        }),
      )
      mockTotalPoolsCount(4)

      render(<PortfolioPools />)

      expect(screen.getByText('5 positions')).toBeInTheDocument()
      expect(screen.queryByText('1 position')).not.toBeInTheDocument()
    })

    it('keeps the count unchanged when the Hidden toggle switches the table to hidden rows', async () => {
      enablePoolsBalances()
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({
          visiblePositions: [
            makePosition({ poolId: 'open-a', tokenId: 'a', status: PositionStatus.IN_RANGE }),
            makePosition({ poolId: 'open-b', tokenId: 'b', status: PositionStatus.OUT_OF_RANGE }),
          ],
          hiddenPositions: [makePosition({ poolId: 'hidden-a', tokenId: 'h', status: PositionStatus.IN_RANGE })],
        }),
      )
      mockTotalPoolsCount(5)

      render(<PortfolioPools />)

      expect(screen.getByText('5 positions')).toBeInTheDocument()

      await act(async () => {
        mocked(PositionsTable).mock.calls.at(-1)?.[0].setShowHiddenPositions(true)
      })

      expect(screen.getByText('5 positions')).toBeInTheDocument()
      expect(screen.queryByText('6 positions')).not.toBeInTheDocument()

      // useShowHiddenPositions is backed by a module-level store keyed by wallet address; reset it so
      // the toggled-on state doesn't leak into later tests that render the same wallet's empty state.
      await act(async () => {
        mocked(PositionsTable).mock.calls.at(-1)?.[0].setShowHiddenPositions(false)
      })
    })

    it('shows the backend open count immediately while more pages remain under the open-only filter', () => {
      enablePoolsBalances()
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({ visiblePositions: [MOCK_POSITION], hasNextPage: true }),
      )
      mockTotalPoolsCount(3)

      render(<PortfolioPools />)

      expect(screen.getByText('3 positions')).toBeInTheDocument()
      expect(screen.queryByText('-')).not.toBeInTheDocument()
    })

    it('renders a "-" placeholder while closed pages remain after selecting the Closed lifecycle', () => {
      enablePoolsBalances()
      mockV2StatusFilter([...V2_POSITION_STATUS_OPTIONS])
      mocked(useWalletPositionsWeb).mockReturnValue(
        createWalletPositionsResult({ visiblePositions: [MOCK_POSITION], hasNextPage: true }),
      )
      mockTotalPoolsCount(3)

      render(<PortfolioPools />)

      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.queryByText('3 positions')).not.toBeInTheDocument()
    })

    it('renders a "-" placeholder when the balance loads but the count is missing', () => {
      enablePoolsBalances()
      mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))
      mockBalanceLoadedWithoutCount()

      render(<PortfolioPools />)

      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.queryByText('1 position')).not.toBeInTheDocument()
      expect(PortfolioBalance).toHaveBeenCalled()
    })
  })

  describe('external wallet mode', () => {
    function mockExternalWallet(): void {
      mocked(usePortfolioAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        isExternalWallet: true,
      })
      mocked(useResolvedAddresses).mockReturnValue({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        isExternalWallet: true,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Pools,
        chainId: undefined,
        externalAddress: { address: SAMPLE_SEED_ADDRESS_1, platform: 'evm' },
        isExternalWallet: true,
      } as unknown as ReturnType<typeof usePortfolioRoutes>)
    }

    it('renders the positions table read-only', () => {
      mockExternalWallet()
      mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ visiblePositions: [MOCK_POSITION] }))

      render(<PortfolioPools />)

      expect(mocked(PositionsTable).mock.calls[0]?.[0]).toEqual(expect.objectContaining({ readOnly: true }))
    })

    it('renders the empty state without the New Position CTA', () => {
      mockExternalWallet()

      render(<PortfolioPools />)

      expect(screen.getByText('No positions')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Explore pools' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'New position' })).not.toBeInTheDocument()
    })

    // Sourcing the total from the connected account would put the viewer's own total above someone
    // else's position rows.
    it('totals the viewed wallet, not the connected one', () => {
      const viewedWallet = '0x000000000000000000000000000000000000dEaD'
      mocked(usePortfolioAddresses).mockReturnValue({
        evmAddress: viewedWallet,
        svmAddress: undefined,
        isExternalWallet: true,
      })
      mocked(useResolvedAddresses).mockReturnValue({
        evmAddress: viewedWallet,
        svmAddress: undefined,
        isExternalWallet: true,
      })
      mocked(usePortfolioRoutes).mockReturnValue({
        tab: PortfolioTab.Pools,
        chainId: undefined,
        externalAddress: { address: viewedWallet, platform: 'evm' },
        isExternalWallet: true,
      } as unknown as ReturnType<typeof usePortfolioRoutes>)
      // Still loading, so the chips mount above the table's loader rather than its rows — this test
      // is about which address the header requests, not about rendering position rows.
      mocked(useWalletPositionsWeb).mockReturnValue(createWalletPositionsResult({ isLoadingPositions: true }))

      render(<PortfolioPools />)

      // The chips fetch their own total from this address; the stub records what the page hands it.
      const balanceAddress = mocked(PositionsSummaryChips).mock.calls.at(-1)?.[0]?.walletAddress
      expect(balanceAddress).toBe(viewedWallet)
      // Same address the sibling positions list is fetched for, from the same source.
      expect(balanceAddress).toBe(mocked(useWalletPositionsWeb).mock.calls.at(-1)?.[0]?.address)
      expect(balanceAddress).not.toBe(SAMPLE_SEED_ADDRESS_1)
    })
  })
})
