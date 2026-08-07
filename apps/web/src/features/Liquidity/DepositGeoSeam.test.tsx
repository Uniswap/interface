import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useBlockedTokens } from '~/features/Liquidity/Create/hooks/useBlockedTokens'
import { DepositStep } from '~/features/Liquidity/Deposit'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useLPPermissionedGating } from '~/features/Liquidity/usePermissionedLP'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { useCreatePositionTxContext } from '~/pages/CreatePosition/CreatePositionTxContext'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/features/Liquidity/usePermissionedLP', () => ({ useLPPermissionedGating: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useBlockedTokens', () => ({ useBlockedTokens: vi.fn() }))
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/pages/CreatePosition/CreatePositionTxContext', () => ({ useCreatePositionTxContext: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useDefaultInitialPrice', () => ({
  useDefaultInitialPrice: () => ({ price: undefined }),
}))
vi.mock('uniswap/src/contexts/UniswapContext', () => ({ useUniswapContext: () => ({ onConnectWallet: vi.fn() }) }))
vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ isConnected: true, address: '0xuser' }) }))
vi.mock('~/hooks/useModalState', () => ({
  useModalState: () => ({ openModal: vi.fn(), closeModal: vi.fn(), isOpen: false }),
}))
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: unknown) => unknown) =>
      selector({ customSlippageTolerance: undefined, slippageWarningModalSeen: false }),
    useTransactionSettingsActions: () => ({ setSlippageWarningModalSeen: vi.fn() }),
  }),
)
vi.mock('~/features/Liquidity/hooks/useDependentAmountFallback', () => ({
  useUpdatedAmountsFromDependentAmount: () => ({
    updatedFormattedAmounts: {},
    updatedCurrencyAmounts: {},
    updatedUSDAmounts: {},
    updatedDeposit0Disabled: false,
    updatedDeposit1Disabled: false,
  }),
}))
// Presentation-only children: they carry no part of the geo decision, and stubbing them keeps the
// step mountable without a real pool/tx graph.
vi.mock('~/features/Liquidity/DepositInputForm', () => ({ DepositInputForm: () => null }))
vi.mock('~/features/Liquidity/DisplayCurrentPrice', () => ({ DisplayCurrentPrice: () => null }))
vi.mock('~/features/Liquidity/LowLPSlippageWarning', () => ({ LowLPSlippageWarning: () => null }))
vi.mock('~/pages/CreatePosition/CreatePositionModal', () => ({ CreatePositionModal: () => null }))
vi.mock('~/pages/CreatePosition/ConfirmCreatePositionModal', () => ({ ConfirmCreatePositionModal: () => null }))
vi.mock('~/components/PermissionedPool/VerifyIdentityModal', () => ({ VerifyIdentityModal: () => null }))
vi.mock('uniswap/src/features/transactions/swap/components/SwapFormSettings/SlippageWarningModal', () => ({
  default: () => null,
}))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const mockedUseLPPermissionedGating = vi.mocked(useLPPermissionedGating)
const mockedUseBlockedTokens = vi.mocked(useBlockedTokens)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)
const mockedUseCreatePositionTxContext = vi.mocked(useCreatePositionTxContext)

const AAPLX = { symbol: 'AAPLX', chainId: 1, address: '0xaaplx', isNative: false } as Currency
const USDC = { symbol: 'USDC', chainId: 1, address: '0xusdc', isNative: false } as Currency

const GEO_LABEL = 'AAPLX unavailable in your region'
const BANNER_HEADING = 'AAPLX isn’t available for liquidity provision in your region'
const REVIEW_LABEL = 'Review'

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

/** A deposit step with every non-geo blocker cleared, so the geo gate is the only thing left. */
function mockDepositReady(): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    priceRangeState: { initialPrice: '1', priceInverted: false },
    protocolVersion: ProtocolVersion.V3,
    creatingPoolOrPair: false,
    currencies: { display: { TOKEN0: AAPLX, TOKEN1: USDC }, sdk: { TOKEN0: AAPLX, TOKEN1: USDC } },
    ticks: [-60, 60],
    poolOrPair: { id: 'pool-id' },
    depositState: { exactField: 'TOKEN0', exactAmounts: {} },
    setDepositState: vi.fn(),
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)

  mockedUseCreatePositionTxContext.mockReturnValue({
    txInfo: { txRequest: { to: '0xrouter' } },
    gasFeeEstimateUSD: undefined,
    dependentAmount: undefined,
    transactionError: undefined,
    setTransactionError: vi.fn(),
    currencyAmounts: {},
    inputError: undefined,
    formattedAmounts: {},
    currencyAmountsUSDValue: {},
    currencyBalances: {},
    preEstimatedGasFee: undefined,
  } as unknown as ReturnType<typeof useCreatePositionTxContext>)
}

/**
 * Seam D: `DepositStep`, the shared Review step for both create-pool and add-liquidity. It is the last
 * screen before the review modal, so a restricted pair reaching it must be stopped here.
 *
 * The gate's own rules (RWA AND, deny-list classification, loading, query-error fail-open) are covered
 * against the real hook with only the compliance boundary mocked in
 * `apps/web/src/features/Liquidity/useLPGeoRestriction.test.ts`. This file asserts what the step does
 * with that verdict, matching the other seam tests.
 */
describe('DepositStep geo gate (deposit seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDepositReady()
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: false, blockedTokenSymbols: [] })
    mockedUseLPPermissionedGating.mockReturnValue({
      isPermissionedAndNotAllowlisted: false,
      isLoading: false,
      permissionedTokenSymbol: undefined,
      permissionedConfig: undefined,
    } as unknown as ReturnType<typeof useLPPermissionedGating>)
  })

  it('replaces the review CTA with the banner and a blocked label when the pair is restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: GEO_LABEL })
    render(<DepositStep />)

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(BANNER_HEADING)).toBeInTheDocument()

    // Not merely disabled: the review CTA is gone and the geo label has taken its place.
    expect(screen.queryByText(REVIEW_LABEL)).toBeNull()
    expect(screen.getByText(GEO_LABEL)).toBeInTheDocument()
  })

  it('renders the review CTA and no banner when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    render(<DepositStep />)

    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
    expect(screen.queryByText(GEO_LABEL)).toBeNull()

    const cta = screen.getByText(REVIEW_LABEL)
    expect(cta).toBeInTheDocument()
    expect(cta.closest('button')).not.toBeDisabled()
  })

  // Deliberate precedence: neither a token safety warning nor identity verification changes a region
  // block's outcome, so the geo banner replaces them rather than stacking with them.
  it('shows only the geo banner when a blocked token and identity verification also apply', () => {
    mockedUseBlockedTokens.mockReturnValue({ hasBlockedToken: true, blockedTokenSymbols: ['AAPLX'] })
    mockedUseLPPermissionedGating.mockReturnValue({
      isPermissionedAndNotAllowlisted: true,
      isLoading: false,
      permissionedTokenSymbol: 'AAPLX',
      permissionedConfig: { registrationUrl: 'https://issuer.example', issuer: 'Issuer' },
    } as unknown as ReturnType<typeof useLPPermissionedGating>)
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: GEO_LABEL })
    render(<DepositStep />)

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    // The competing gates' own CTAs must not appear alongside it.
    expect(screen.queryByText('Verify identity')).toBeNull()
    expect(screen.getByText(GEO_LABEL)).toBeInTheDocument()
  })

  // The happy path still has to work: the gate must not be so eager that a clean pair cannot review.
  it('opens the review modal from the CTA when the pair is clean', () => {
    mockGeoRestriction({})
    render(<DepositStep />)

    const cta = screen.getByText(REVIEW_LABEL).closest('button')
    expect(cta).not.toBeNull()
    fireEvent.click(cta as HTMLButtonElement)

    // The geo gate did not intercept: the CTA stayed the review CTA and is still actionable.
    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
    expect(screen.getByText(REVIEW_LABEL)).toBeInTheDocument()
  })
})
