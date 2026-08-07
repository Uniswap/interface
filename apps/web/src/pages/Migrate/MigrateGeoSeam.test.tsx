import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { SelectPriceRangeStep } from '~/features/Liquidity/Create/RangeSelectionStep'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { useMigrateGeoGate } from '~/pages/Migrate/useMigrateGeoGate'
import { render, screen } from '~/test-utils/render'

// Only the compliance boundary is mocked. `useMigrateGeoGate` and `SelectPriceRangeStep` are both
// real here, which is the point of this file: their unit tests each assert one side of the
// `{ disableContinue, geoRestriction }` contract, so neither would catch the two drifting apart.
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useTokenControlOptions', () => ({ useTokenControlOptions: () => [] }))
vi.mock('~/features/Liquidity/Create/hooks/useDefaultInitialPrice', () => ({
  useDefaultInitialPrice: () => ({ price: undefined, isLoading: false }),
}))
vi.mock('~/features/Liquidity/Create/PoolOutOfSyncError', () => ({ PoolOutOfSyncError: () => null }))
vi.mock('~/features/Liquidity/Create/PoolParsingError', () => ({ PoolParsingError: () => null }))
vi.mock('~/features/Liquidity/Create/PositionOutOfRangeError', () => ({ PositionOutOfRangeError: () => null }))
vi.mock('~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeInput', () => ({
  D3LiquidityRangeInput: () => null,
}))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false } as Currency
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false } as Currency

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

/** An existing v4 pool on a valid full range, so only the geo gate can disable Continue. */
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

/**
 * Mirrors how `MigrateInner` threads the gate into the price-range step (pages/Migrate/index.tsx):
 * migration never renders `DepositStep`, so this Continue is the last CTA before the review modal.
 */
function MigrateSeamHarness({ onContinue }: { onContinue: () => void }): JSX.Element {
  const { disableContinue, geoRestriction } = useMigrateGeoGate({ token0: AAPLX, token1: USDC })

  return (
    <SelectPriceRangeStep onContinue={onContinue} disableContinue={disableContinue} geoRestriction={geoRestriction} />
  )
}

describe('migrate geo seam (useMigrateGeoGate composed with SelectPriceRangeStep)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMigrationContext()
  })

  // The default mock is `isGeoRestricted: false`, which is what the gate reports both for a resolved
  // clean pair and while the compliance answer is still in flight — LP fails open like swap, so
  // Continue stays live through that window. There is no separate pending verdict to assert.
  it('advances on Continue when the pair is not restricted', () => {
    mockGeoRestriction({})
    const onContinue = vi.fn()
    render(<MigrateSeamHarness onContinue={onContinue} />)

    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
  })

  it('blocks the migration and names the restricted token when the pair is restricted', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: 'AAPLX',
      unavailableLabel: 'AAPLX unavailable in your region',
    })
    const onContinue = vi.fn()
    render(<MigrateSeamHarness onContinue={onContinue} />)

    // Both fields travel through the real hook into the real step: the label onto the CTA, the
    // symbol into the banner's own i18n lookup.
    expect(screen.queryByText('Continue')).toBeNull()
    fireEvent.click(screen.getByText('AAPLX unavailable in your region'))
    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText('AAPLX isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })

  it('falls back to the generic copy when the restricted token has no symbol', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: undefined })
    render(<MigrateSeamHarness onContinue={vi.fn()} />)

    expect(screen.getByText('Not available in your region')).toBeInTheDocument()
    expect(screen.getByText('This token isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })
})
