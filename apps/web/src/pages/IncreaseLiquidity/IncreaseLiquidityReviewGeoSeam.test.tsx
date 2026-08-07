import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { IncreaseLiquidityReview } from '~/pages/IncreaseLiquidity/IncreaseLiquidityReview'
import { useIncreaseLiquidityTxContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/pages/IncreaseLiquidity/IncreaseLiquidityContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/IncreaseLiquidity/IncreaseLiquidityContext')>()),
  useIncreaseLiquidityContext: vi.fn(),
}))
vi.mock('~/pages/IncreaseLiquidity/IncreaseLiquidityTxContext', () => ({ useIncreaseLiquidityTxContext: vi.fn() }))
vi.mock('~/hooks/Tokens', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ isConnected: true, chainId: 1, connector: { id: 'x' } }) }))
vi.mock('~/hooks/useSelectChain', () => ({ useSelectChain: () => vi.fn() }))
vi.mock('@universe/embedded-wallet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/embedded-wallet')>()),
  useGetPasskeyAuthStatus: () => ({
    isSignedInWithPasskey: false,
    isSessionAuthenticated: false,
    needsPasskeySignin: false,
  }),
}))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({ useUSDCValue: () => undefined }))
vi.mock('~/features/Liquidity/hooks/useGetPoolTokenPercentage', () => ({ useGetPoolTokenPercentage: () => undefined }))
vi.mock('~/features/Liquidity/hooks/useDependentAmountFallback', () => ({
  useUpdatedAmountsFromDependentAmount: ({ currencyAmounts }: { currencyAmounts: unknown }) => ({
    updatedCurrencyAmounts: currencyAmounts,
    updatedUSDAmounts: undefined,
  }),
}))
// Partial: the render wrapper's accounts store also reads `useOneClickSwapSetting` from this module.
vi.mock('~/pages/Swap/Swap/settings/OneClickSwap', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Swap/settings/OneClickSwap')>()),
  useSetOverrideOneClickSwapFlag: () => vi.fn(),
}))
// Presentation-only children: none carry any part of the geo decision.
vi.mock('uniswap/src/components/ConfirmSwapModal/ProgressIndicator', () => ({ ProgressIndicator: () => null }))
vi.mock('~/features/Liquidity/TokenInfo', () => ({ TokenInfo: () => null }))

const mockedUseLPGeoRestriction = vi.mocked(useLPGeoRestriction)
const mockedUseIncreaseLiquidityContext = vi.mocked(useIncreaseLiquidityContext)
const mockedUseIncreaseLiquidityTxContext = vi.mocked(useIncreaseLiquidityTxContext)

// Real `Token`s so the SDK amount math in this step works on them.
const AAPLX = new Token(1, '0x0000000000000000000000000000000000000a11', 18, 'AAPLX')
const USDC = new Token(1, '0x0000000000000000000000000000000000000b22', 6, 'USDC')

const GEO_LABEL = 'AAPLX unavailable in your region'
const BANNER_HEADING = 'AAPLX isn’t available for liquidity provision in your region'
const CONFIRM_LABEL = 'Confirm'

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

/** An increase-liquidity review with every non-geo blocker cleared. */
function mockReviewReady(): void {
  mockedUseIncreaseLiquidityContext.mockReturnValue({
    setStep: vi.fn(),
    derivedIncreaseLiquidityInfo: {
      currencyAmounts: { TOKEN0: amount(AAPLX), TOKEN1: amount(USDC) },
      currencyAmountsUSDValue: {},
    },
    increaseLiquidityState: {
      exactField: 'TOKEN0',
      position: {
        version: ProtocolVersion.V3,
        poolId: 'pool-id',
        currency0Amount: amount(AAPLX),
        currency1Amount: amount(USDC),
        fee0Amount: undefined,
        fee1Amount: undefined,
        feeTier: undefined,
        v4hook: undefined,
        tickSpacing: 60,
        tickLower: -60,
        tickUpper: 60,
        chainId: 1,
        poolOrPair: undefined,
      },
    },
    currentTransactionStep: undefined,
    setCurrentTransactionStep: vi.fn(),
  } as unknown as ReturnType<typeof useIncreaseLiquidityContext>)

  mockedUseIncreaseLiquidityTxContext.mockReturnValue({
    txInfo: { txRequest: { to: '0xrouter' } },
    gasFeeEstimateUSD: undefined,
    dependentAmount: undefined,
    setTransactionError: vi.fn(),
  } as unknown as ReturnType<typeof useIncreaseLiquidityTxContext>)
}

function confirmButton(): HTMLButtonElement {
  const label = screen.getByText((text) => text === CONFIRM_LABEL || text === GEO_LABEL)
  const button = label.closest('button')
  expect(button).not.toBeNull()
  return button as HTMLButtonElement
}

/**
 * Seam C's signing surface. `IncreaseLiquidityForm` gates the step that opens this one, but that gate
 * fails open while the compliance answer is in flight, so a user CAN press Review before the verdict
 * lands. The third case is the one that covers that window — the already-restricted case would have
 * been stopped by the form gate.
 */
describe('IncreaseLiquidityReview geo gate (signing surface)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReviewReady()
  })

  it('confirms normally when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    render(<IncreaseLiquidityReview onClose={vi.fn()} />)

    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
    expect(confirmButton()).not.toBeDisabled()
  })

  it('disables confirm and explains why when the pair is already restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: GEO_LABEL })
    render(<IncreaseLiquidityReview onClose={vi.fn()} />)

    expect(confirmButton()).toBeDisabled()
    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(BANNER_HEADING)).toBeInTheDocument()
  })

  it('kills a live confirm when the restriction resolves while the review is already open', () => {
    mockGeoRestriction({})
    const { rerender } = render(<IncreaseLiquidityReview onClose={vi.fn()} />)

    expect(confirmButton()).not.toBeDisabled()

    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'AAPLX', unavailableLabel: GEO_LABEL })
    rerender(<IncreaseLiquidityReview onClose={vi.fn()} />)

    expect(confirmButton()).toBeDisabled()
    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(GEO_LABEL)).toBeInTheDocument()
  })
})
