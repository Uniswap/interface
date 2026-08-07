import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ReviewModal } from '~/features/Liquidity/ReviewModal'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/hooks/Tokens', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ isConnected: true, connector: { id: 'injected' } }) }))
vi.mock('@universe/embedded-wallet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/embedded-wallet')>()),
  useGetPasskeyAuthStatus: () => ({
    isSignedInWithPasskey: false,
    isSessionAuthenticated: false,
    needsPasskeySignin: false,
  }),
}))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({ useUSDCValue: () => undefined }))
vi.mock('~/features/Liquidity/hooks/useSelectedFeeBreakdown', () => ({ useSelectedFeeBreakdown: () => undefined }))
// Presentation-only children: none of them carry any part of the geo decision, and stubbing them keeps
// the modal mountable without a real pool/chart/tx graph.
vi.mock('~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart', () => ({
  getLiquidityRangeChartProps: () => undefined,
  WrappedLiquidityPositionRangeChart: () => null,
}))
vi.mock('~/features/Liquidity/LowLPSlippageWarning', () => ({ LowLPSlippageWarning: () => null }))
vi.mock('~/features/Liquidity/PartialMigrationWarning', () => ({ PartialMigrationWarning: () => null }))
vi.mock('~/features/Liquidity/Create/PoolOutOfSyncError', () => ({ PoolOutOfSyncError: () => null }))
vi.mock('~/features/Liquidity/LiquidityPositionInfoBadges', () => ({ LiquidityPositionInfoBadges: () => null }))
vi.mock('~/features/Liquidity/BaseQuoteFiatAmount', () => ({ BaseQuoteFiatAmount: () => null }))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

// Real `Token`s rather than object literals: the modal runs tick->price conversion over these, which
// needs the SDK's `sortsBefore`.
const AAPLX = new Token(1, '0x0000000000000000000000000000000000000a11', 18, 'AAPLX')
const USDC = new Token(1, '0x0000000000000000000000000000000000000b22', 6, 'USDC')

const GEO_LABEL = 'AAPLX unavailable in your region'
const BANNER_HEADING = 'AAPLX isn’t available for liquidity provision in your region'
const CONFIRM_LABEL = 'Create'

function amount(currency: Currency): CurrencyAmount<Currency> {
  // String, not a native BigInt: the SDK routes through jsbi, which rejects BigInt inputs.
  return CurrencyAmount.fromRawAmount(currency, `1${'0'.repeat(currency.decimals)}`)
}

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

function mockContext(): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    currencies: { display: { TOKEN0: AAPLX, TOKEN1: USDC }, sdk: { TOKEN0: AAPLX, TOKEN1: USDC } },
    protocolVersion: ProtocolVersion.V3,
    creatingPoolOrPair: false,
    positionState: { fee: undefined, hook: undefined },
    protocolFee: undefined,
    currentTransactionStep: undefined,
    price: undefined,
    poolOrPair: { id: 'pool-id' },
    ticks: [-60, 60],
    priceRangeState: { priceInverted: false, fullRange: true, minTick: -60, maxTick: 60 },
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function renderReviewModal(onConfirm = vi.fn()) {
  return {
    onConfirm,
    ...render(
      <ReviewModal
        modalName={ModalName.CreatePosition}
        headerTitle="Create position"
        confirmButtonText={CONFIRM_LABEL}
        currencyAmounts={{ TOKEN0: amount(AAPLX), TOKEN1: amount(USDC) }}
        isDisabled={false}
        transactionError={false}
        steps={[]}
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    ),
  }
}

function confirmButton(): HTMLButtonElement {
  const label = screen.getByText((text) => text === CONFIRM_LABEL || text === GEO_LABEL)
  const button = label.closest('button')
  expect(button).not.toBeNull()
  return button as HTMLButtonElement
}

/**
 * The signing-surface half of the LP geo gate. `ReviewModal` is the confirm surface for two seams —
 * create/add-liquidity (via `CreatePositionModal`) and migration (`pages/Migrate/index.tsx`) — so
 * gating it here covers both.
 *
 * The case that matters is the third one: the form gate fails open while the compliance answer is in
 * flight, so a user CAN press Continue and open this modal before the verdict lands. Nothing else
 * covers that window — the already-restricted case would have been stopped by the form gate.
 *
 * The gate's own rules (RWA AND, deny-list classification, fail-open while loading) are covered against
 * the real hook in `apps/web/src/features/Liquidity/useLPGeoRestriction.test.ts`.
 */
describe('ReviewModal geo gate (signing surface)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext()
  })

  it('confirms normally when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    renderReviewModal()

    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
    expect(confirmButton()).not.toBeDisabled()
  })

  it('disables confirm and explains why when the pair is already restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: GEO_LABEL })
    renderReviewModal()

    expect(confirmButton()).toBeDisabled()
    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(BANNER_HEADING)).toBeInTheDocument()
    expect(screen.getByText(GEO_LABEL)).toBeInTheDocument()
  })

  // The whole reason this layer exists: the form gate let the user through during the fail-open
  // in-flight window, and the restriction only resolves now, with the modal already open.
  it('kills a live confirm when the restriction resolves while the modal is already open', () => {
    mockGeoRestriction({})
    const { rerender } = renderReviewModal()

    expect(confirmButton()).not.toBeDisabled()

    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: GEO_LABEL })
    rerender(
      <ReviewModal
        modalName={ModalName.CreatePosition}
        headerTitle="Create position"
        confirmButtonText={CONFIRM_LABEL}
        currencyAmounts={{ TOKEN0: amount(AAPLX), TOKEN1: amount(USDC) }}
        isDisabled={false}
        transactionError={false}
        steps={[]}
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(confirmButton()).toBeDisabled()
    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(GEO_LABEL)).toBeInTheDocument()
  })
})
