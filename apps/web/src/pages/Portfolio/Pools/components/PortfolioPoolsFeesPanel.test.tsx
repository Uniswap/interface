import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { PortfolioPoolsFeesPanel } from '~/pages/Portfolio/Pools/components/PortfolioPoolsFeesPanel'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('~/state/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/hooks')>()),
  useAppDispatch: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: vi.fn(),
}))

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', () => ({
  useWalletPositions: vi.fn(),
}))

const dispatch = vi.fn()

function buildPosition(overrides: {
  poolId: string
  tokenId?: string
  uncollectedFeesUsd?: number
  version?: ProtocolVersion
}): PositionInfo {
  const { poolId, tokenId = `${poolId}-1`, uncollectedFeesUsd, version = ProtocolVersion.V3 } = overrides

  return {
    poolId,
    tokenId,
    chainId: UniverseChainId.Mainnet,
    version,
    status: 1,
    currency0Amount: CurrencyAmount.fromRawAmount(USDC_MAINNET, '0'),
    currency1Amount: CurrencyAmount.fromRawAmount(DAI, '0'),
    uncollectedFeesUsd,
  } as unknown as PositionInfo
}

function mockPositions(
  positions: PositionInfo[],
  opts: { isLoading?: boolean; hasNextPage?: boolean; isFetchingNextPage?: boolean; error?: Error } = {},
): void {
  mocked(useWalletPositions).mockReturnValue({
    positions,
    hiddenPositions: [],
    allPositions: positions,
    isLoading: opts.isLoading ?? false,
    isFetching: false,
    isFetchingNextPage: opts.isFetchingNextPage ?? false,
    isPlaceholderData: false,
    hasNextPage: opts.hasNextPage ?? false,
    hasData: !opts.isLoading,
    error: opts.error ?? null,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
  } as unknown as ReturnType<typeof useWalletPositions>)
}

describe('PortfolioPoolsFeesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useAppDispatch).mockReturnValue(dispatch)
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number | string | undefined | null, numberType?: NumberType) => {
        const n = Number(value ?? 0)
        // Simulate FiatTokenQuantity: 0 → "$0.00", (0, 0.01) → "<$0.01", otherwise → "$X.XX"
        if (numberType === NumberType.FiatTokenQuantity && n > 0 && n < 0.01) {
          return '<$0.01'
        }
        return `$${n.toFixed(2)}`
      },
    } as unknown as ReturnType<typeof useLocalizationContext>)
    mockPositions([])
  })

  it('renders null when no wallet address is provided', () => {
    render(<PortfolioPoolsFeesPanel walletAddress={undefined} chainId={undefined} />)
    expect(screen.queryByText('Total fees earned')).not.toBeInTheDocument()
  })

  it('renders the zero state with $0.00 when all pages have loaded and there are no positions', () => {
    mockPositions([])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByText('Total fees earned')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesEmpty)).toHaveTextContent('$0.00')
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('renders the zero state when no positions have claimable fees', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 0 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: undefined }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesEmpty)).toHaveTextContent('$0.00')
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('renders the zero state when only V2 positions have fees (V2 has no claim path)', () => {
    mockPositions([buildPosition({ poolId: 'a', version: ProtocolVersion.V2, uncollectedFeesUsd: 50 })])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesEmpty)).toHaveTextContent('$0.00')
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('hides the card on error', () => {
    mockPositions([], { error: new Error('boom') })
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.queryByText('Total fees earned')).not.toBeInTheDocument()
  })

  it('shows a header skeleton while the first page is loading', () => {
    mockPositions([], { isLoading: true })
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByText('Total fees earned')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('keeps the skeleton up while subsequent pages are still loading', () => {
    mockPositions([buildPosition({ poolId: 'a', uncollectedFeesUsd: 99 })], { hasNextPage: true })
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByText('Total fees earned')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioPoolsFeesTotal)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioPoolsFeesRow)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })

  it('renders the aggregate total summing all eligible positions', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 81.48 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: 52.34 }),
      buildPosition({ poolId: 'c', uncollectedFeesUsd: 21.98 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesTotal)).toHaveTextContent('$155.80')
  })

  it('excludes V2 positions from the total and rows', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 81.48 }),
      buildPosition({ poolId: 'v2', version: ProtocolVersion.V2, uncollectedFeesUsd: 999 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesTotal)).toHaveTextContent('$81.48')
    const rows = screen.getAllByTestId(TestID.PortfolioPoolsFeesRow)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('$81.48')
  })

  it('sorts rows descending by uncollectedFeesUsd', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 21.98 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: 81.48 }),
      buildPosition({ poolId: 'c', uncollectedFeesUsd: 52.34 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesTotal)).toHaveTextContent('$155.80')
    const rowValues = screen.getAllByTestId(TestID.PortfolioPoolsFeesRow).map((node) => node.textContent)
    expect(rowValues).toEqual(['$81.48', '$52.34', '$21.98'])
  })

  it('renders all rows inline when there are 4 or fewer eligible positions', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 10 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: 9 }),
      buildPosition({ poolId: 'c', uncollectedFeesUsd: 8 }),
      buildPosition({ poolId: 'd', uncollectedFeesUsd: 7 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.queryByTestId(TestID.ExpandoRow)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Collect' })).toHaveLength(4)
  })

  it('renders 3 rows + expando bar when there are 5 or more eligible positions', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 50 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: 40 }),
      buildPosition({ poolId: 'c', uncollectedFeesUsd: 30 }),
      buildPosition({ poolId: 'd', uncollectedFeesUsd: 20 }),
      buildPosition({ poolId: 'e', uncollectedFeesUsd: 10 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(screen.getByTestId(TestID.ExpandoRow)).toBeInTheDocument()
    expect(screen.getByText('2 more')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Collect' })).toHaveLength(3)
  })

  it('expands the remainder when the expando bar is clicked', async () => {
    const user = userEvent.setup()
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 50 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: 40 }),
      buildPosition({ poolId: 'c', uncollectedFeesUsd: 30 }),
      buildPosition({ poolId: 'd', uncollectedFeesUsd: 20 }),
      buildPosition({ poolId: 'e', uncollectedFeesUsd: 10 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)

    await user.click(screen.getByTestId(TestID.ExpandoRow))

    expect(screen.getAllByRole('button', { name: 'Collect' })).toHaveLength(5)
  })

  it('forwards the page-level chain scope to useWalletPositions', () => {
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={UniverseChainId.ArbitrumOne} />)
    expect(useWalletPositions).toHaveBeenCalledWith(
      expect.objectContaining({
        account: SAMPLE_SEED_ADDRESS_1,
        chainIds: [UniverseChainId.ArbitrumOne],
        autoFetchAllPages: true,
      }),
    )
  })

  it('requests all chains and auto-fetches all pages when no chain scope is set', () => {
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    expect(useWalletPositions).toHaveBeenCalledWith(
      expect.objectContaining({
        account: SAMPLE_SEED_ADDRESS_1,
        chainIds: undefined,
        autoFetchAllPages: true,
      }),
    )
  })

  it('renders sub-cent fees as <$0.01 via FiatTokenQuantity', () => {
    mockPositions([buildPosition({ poolId: 'dust', uncollectedFeesUsd: 0.003 })])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)
    // Both the header total (0.003) and the row (0.003) hit the sub-cent path.
    // If the card regressed to NumberType.PortfolioBalance the mock would render "$0.00".
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesTotal)).toHaveTextContent('<$0.01')
    const rows = screen.getAllByTestId(TestID.PortfolioPoolsFeesRow)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('<$0.01')
    expect(screen.queryByTestId(TestID.PortfolioPoolsFeesEmpty)).not.toBeInTheDocument()
  })

  it('dispatches setOpenModal with the position when the Collect button is clicked', async () => {
    const user = userEvent.setup()
    const target = buildPosition({ poolId: 'target', uncollectedFeesUsd: 50 })
    mockPositions([target])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} />)

    await user.click(screen.getByRole('button', { name: 'Collect' }))

    expect(dispatch).toHaveBeenCalledWith(setOpenModal({ name: ModalName.ClaimFee, initialState: target }))
  })

  it('hides every per-row Collect button when viewing an external wallet', () => {
    mockPositions([
      buildPosition({ poolId: 'a', uncollectedFeesUsd: 50 }),
      buildPosition({ poolId: 'b', uncollectedFeesUsd: 40 }),
      buildPosition({ poolId: 'c', uncollectedFeesUsd: 30 }),
    ])
    render(<PortfolioPoolsFeesPanel walletAddress={SAMPLE_SEED_ADDRESS_1} chainId={undefined} isExternalWallet />)

    // The aggregate + per-row USD values still render so the watcher can see the data.
    expect(screen.getByTestId(TestID.PortfolioPoolsFeesTotal)).toHaveTextContent('$120.00')
    expect(screen.queryByRole('button', { name: 'Collect' })).not.toBeInTheDocument()
  })
})
