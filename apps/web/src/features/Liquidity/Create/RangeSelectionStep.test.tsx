import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { SelectPriceRangeStep } from '~/features/Liquidity/Create/RangeSelectionStep'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({
  useCreateLiquidityContext: vi.fn(),
}))
vi.mock('~/features/Liquidity/Create/hooks/useTokenControlOptions', () => ({
  useTokenControlOptions: () => [],
}))
vi.mock('~/features/Liquidity/Create/hooks/useDefaultInitialPrice', () => ({
  useDefaultInitialPrice: () => ({ price: undefined, isLoading: false }),
}))
vi.mock('~/features/Liquidity/Create/PoolOutOfSyncError', () => ({ PoolOutOfSyncError: () => null }))
vi.mock('~/features/Liquidity/Create/PoolParsingError', () => ({ PoolParsingError: () => null }))
vi.mock('~/features/Liquidity/Create/PositionOutOfRangeError', () => ({ PositionOutOfRangeError: () => null }))
vi.mock('~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeInput', () => ({
  D3LiquidityRangeInput: () => null,
}))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false }
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false }

const GEO_RESTRICTION = { tokenSymbol: 'AAPLX', unavailableLabel: 'AAPLX unavailable in your region' }

/**
 * A migration-shaped context: an existing v4 pool (so no initial price is required) with a valid
 * full range, meaning nothing but the geo gate can disable Continue.
 */
function mockMigrationContext(): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    positionState: { fee: undefined, hook: undefined, migratingPosition: undefined },
    currencies: { display: { TOKEN0: AAPLX, TOKEN1: USDC }, sdk: { TOKEN0: AAPLX, TOKEN1: USDC } },
    creatingPoolOrPair: false,
    poolOrPairLoading: false,
    poolId: 'pool-id',
    protocolVersion: ProtocolVersion.V4,
    poolOrPair: undefined,
    price: undefined,
    ticks: [undefined, undefined],
    priceRangeState: { fullRange: true, priceInverted: false, minTick: undefined, maxTick: undefined },
    setPriceRangeState: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

describe('SelectPriceRangeStep geo gate (migration seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMigrationContext()
  })

  it('advances on Continue when there is no geo restriction', () => {
    const onContinue = vi.fn()
    render(<SelectPriceRangeStep onContinue={onContinue} disableContinue={false} />)

    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  // Migration never renders DepositStep, so this Continue is the last CTA before the review modal:
  // if it stays pressable, a restricted user reaches a signable transaction.
  it('replaces Continue with an inert region-unavailable button when restricted', () => {
    const onContinue = vi.fn()
    render(<SelectPriceRangeStep onContinue={onContinue} disableContinue={false} geoRestriction={GEO_RESTRICTION} />)

    expect(screen.getByText('AAPLX unavailable in your region')).toBeInTheDocument()
    expect(screen.queryByText('Continue')).toBeNull()

    fireEvent.click(screen.getByText('AAPLX unavailable in your region'))
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('shows the liquidity-provision banner naming the restricted token', () => {
    render(<SelectPriceRangeStep onContinue={vi.fn()} disableContinue={false} geoRestriction={GEO_RESTRICTION} />)

    expect(screen.getByText('AAPLX isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })

  // `disableContinue` is not a geo signal. The gate fails open like swap, so an unresolved check
  // reads as clean and never disables Continue on its own — that window is asserted directly against
  // the real hook in `useLPGeoRestriction.test.ts` ("in flight -> allowed (fail open)"), and a
  // confirmed restriction always arrives with `geoRestriction` set, covered by the case above.
  // Migration's remaining sources for this prop are `!txInfo` and `transactionError`
  // (`pages/Migrate/index.tsx:207`). What is worth pinning is that a Continue disabled for one of
  // those non-geo reasons does not borrow the geo copy.
  it('keeps Continue unpressable without geo copy when disabled for a non-geo reason', () => {
    const onContinue = vi.fn()
    render(<SelectPriceRangeStep onContinue={onContinue} disableContinue={true} />)

    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.queryByText('AAPLX unavailable in your region')).toBeNull()
    expect(screen.queryByText(/liquidity provision in your region/)).toBeNull()
  })

  it('renders no banner and no blocked CTA for a clean pair', () => {
    render(<SelectPriceRangeStep onContinue={vi.fn()} disableContinue={false} />)

    expect(screen.queryByText(/unavailable in your region/)).toBeNull()
    expect(screen.queryByText(/liquidity provision in your region/)).toBeNull()
  })
})
