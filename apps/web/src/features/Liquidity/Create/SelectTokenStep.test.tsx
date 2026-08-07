import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useBlockedTokens } from '~/features/Liquidity/Create/hooks/useBlockedTokens'
import { SelectTokensStep } from '~/features/Liquidity/Create/SelectTokenStep'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useBlockedTokens', () => ({ useBlockedTokens: vi.fn() }))
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useLiquidityUrlState', () => ({
  useLiquidityUrlState: () => ({ loadingA: false, loadingB: false, hook: undefined }),
}))
vi.mock('~/features/Liquidity/Create/hooks/useRecommendedPermissionedHook', () => ({
  useRecommendedHookPrefill: () => undefined,
}))
vi.mock('~/state/multichain/useMultichainContext', () => ({
  useMultichainContext: () => ({ setSelectedChainId: vi.fn(), setIsUserSelectedToken: vi.fn() }),
}))
vi.mock('~/features/Liquidity/hooks/useAllFeeTierPoolData', () => ({
  useAllFeeTierPoolData: () => ({ feeTierData: {}, hasExistingFeeTiers: false }),
}))
vi.mock('~/features/Liquidity/hooks/useSelectedFeeBreakdown', () => ({
  useSelectedFeeBreakdown: () => ({ selectedFeeBreakdown: undefined }),
}))
vi.mock('~/components/SearchModal/CurrencySearchModal', () => ({ CurrencySearchModal: () => null }))
vi.mock('~/features/Liquidity/HookModal', () => ({ HookModal: () => null }))
vi.mock('~/features/Liquidity/Create/AddHook', () => ({ AddHook: () => <div data-testid="add-hook" /> }))
vi.mock('~/features/Liquidity/Create/PoolParsingError', () => ({ PoolParsingError: () => null }))
vi.mock('~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay', () => ({ LpIncentivesAprDisplay: () => null }))
vi.mock('~/features/Liquidity/CurrencySelector', () => ({ CurrencySelector: () => null }))

// Stubbed so the `disabled` prop the step computes from `hasError` is observable; the value asserted
// is the real one SelectTokensStep derives, not a value the stub invents.
vi.mock('~/features/Liquidity/FeeTierSelector', () => ({
  FeeTierSelector: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="fee-tier-selector" data-disabled={String(Boolean(disabled))} />
  ),
}))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const mockedUseBlockedTokens = vi.mocked(useBlockedTokens)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false } as Currency
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false } as Currency

const CURRENCY_INPUTS = { tokenA: AAPLX, tokenB: USDC }

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

/**
 * An existing pool with a fee tier already selected, so the only thing left that can disable
 * Continue is the geo gate.
 */
function mockCreateLiquidityContext(): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    positionState: {
      hook: undefined,
      userApprovedHook: undefined,
      fee: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
      migratingPosition: undefined,
    },
    setPositionState: vi.fn(),
    protocolVersion: ProtocolVersion.V3,
    creatingPoolOrPair: false,
    currencies: { display: { TOKEN0: AAPLX, TOKEN1: USDC }, sdk: { TOKEN0: AAPLX, TOKEN1: USDC } },
    poolOrPairLoading: false,
    poolOrPair: { id: 'pool-id' },
    poolId: 'pool-id',
    protocolFee: undefined,
    setFeeTierSearchModalOpen: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function renderStep(onContinue = vi.fn()): { onContinue: ReturnType<typeof vi.fn> } {
  render(<SelectTokensStep currencyInputs={CURRENCY_INPUTS} setCurrencyInputs={vi.fn()} onContinue={onContinue} />)
  return { onContinue }
}

describe('SelectTokensStep geo gate (select-tokens seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateLiquidityContext()
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: false, blockedTokenSymbols: [] })
  })

  it('advances on the CTA when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    const { onContinue } = renderStep()

    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
  })

  // Seam A is the earliest block: if this CTA advances, the user reaches the deposit step with a
  // restricted pair already committed.
  it('replaces the CTA with an inert region-unavailable button when the pair is restricted', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: 'AAPLX',
      unavailableLabel: 'AAPLX unavailable in your region',
    })
    const { onContinue } = renderStep()

    expect(screen.queryByText('Continue')).toBeNull()
    fireEvent.click(screen.getByText('AAPLX unavailable in your region'))
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('shows the geo banner naming the restricted token when restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: 'unavailable' })
    renderStep()

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeInTheDocument()
    expect(screen.getByText('AAPLX isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })

  it('folds the restriction into hasError so the fee-tier selector is disabled too', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: 'unavailable' })
    renderStep()

    expect(screen.getByTestId('fee-tier-selector')).toHaveAttribute('data-disabled', 'true')
  })

  it('leaves the fee-tier selector enabled for a clean pair', () => {
    mockGeoRestriction({})
    renderStep()

    expect(screen.getByTestId('fee-tier-selector')).toHaveAttribute('data-disabled', 'false')
  })

  // The geo block has no remedy, so it replaces the blocked-token callout rather than stacking with
  // it: two competing "not available" messages would leave the user unsure which one applies.
  it('replaces the blocked-token callout with the geo banner when both apply', () => {
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: true, blockedTokenSymbols: ['AAPLX'] })
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: 'unavailable' })
    renderStep()

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeInTheDocument()
    expect(screen.queryByText('AAPLX is not available')).toBeNull()
  })

  it('still shows the blocked-token callout when only the token-safety block applies', () => {
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: true, blockedTokenSymbols: ['AAPLX'] })
    mockGeoRestriction({})
    renderStep()

    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
    expect(screen.getByText('AAPLX is not available')).toBeInTheDocument()
  })

  it('falls back to the generic label when the restricted token has no symbol', () => {
    mockGeoRestriction({
      isGeoRestricted: true,
      restrictedTokenSymbol: undefined,
      unavailableLabel: 'Not available in your region',
    })
    renderStep()

    expect(screen.getByText('Not available in your region')).toBeInTheDocument()
    expect(screen.getByText('This token isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })
})
