import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ReviewModal } from '~/features/Liquidity/ReviewModal'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({
  useLPGeoRestriction: () => ({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
  }),
}))
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
// Presentation-only children with no bearing on the initial-price line; stubbing them keeps the modal
// mountable without a real pool/chart/tx graph. BaseQuoteFiatAmount stays real — it's the surface under test.
vi.mock('~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart', () => ({
  getLiquidityRangeChartProps: () => undefined,
  WrappedLiquidityPositionRangeChart: () => null,
}))
vi.mock('~/features/Liquidity/LowLPSlippageWarning', () => ({ LowLPSlippageWarning: () => null }))
vi.mock('~/features/Liquidity/PartialMigrationWarning', () => ({ PartialMigrationWarning: () => null }))
vi.mock('~/features/Liquidity/Create/PoolOutOfSyncError', () => ({ PoolOutOfSyncError: () => null }))
vi.mock('~/features/Liquidity/LiquidityPositionInfoBadges', () => ({ LiquidityPositionInfoBadges: () => null }))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

// Sorted order matters: USDC's address sorts first, so it is token0 and KHYPE is token1. That makes
// "USDC per KHYPE" the inverted orientation — the one the bug lived in.
const USDC = new Token(1, '0x0000000000000000000000000000000000000a11', 6, 'USDC')
const KHYPE = new Token(1, '0x0000000000000000000000000000000000000b22', 18, 'KHYPE')

// getInitialPrice hands the create flow a canonical (token1-per-token0) price no matter which way the
// user typed it. 80 USDC = 1 KHYPE is canonically 0.0125 KHYPE = 1 USDC.
const CANONICAL_PRICE = new Price(USDC, KHYPE, `80${'0'.repeat(USDC.decimals)}`, `1${'0'.repeat(KHYPE.decimals)}`)

function amount(currency: Currency): CurrencyAmount<Currency> {
  return CurrencyAmount.fromRawAmount(currency, `1${'0'.repeat(currency.decimals)}`)
}

function mockContext({ priceInverted }: { priceInverted: boolean }): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    currencies: { display: { TOKEN0: USDC, TOKEN1: KHYPE }, sdk: { TOKEN0: USDC, TOKEN1: KHYPE } },
    protocolVersion: ProtocolVersion.V4,
    creatingPoolOrPair: true,
    positionState: { fee: undefined, hook: undefined },
    protocolFee: undefined,
    currentTransactionStep: undefined,
    price: CANONICAL_PRICE,
    poolOrPair: { id: 'pool-id' },
    ticks: [-60, 60],
    priceRangeState: { priceInverted, fullRange: true, minTick: -60, maxTick: 60 },
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function renderReviewModal() {
  return render(
    <ReviewModal
      modalName={ModalName.CreatePosition}
      headerTitle="Create position"
      confirmButtonText="Create"
      currencyAmounts={{ TOKEN0: amount(USDC), TOKEN1: amount(KHYPE) }}
      isDisabled={false}
      transactionError={false}
      steps={[]}
      isOpen
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  )
}

describe('ReviewModal initial price orientation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the canonical price as-is when the display orientation matches it', () => {
    mockContext({ priceInverted: false })
    renderReviewModal()

    expect(screen.getByText('0.0125 KHYPE = 1 USDC')).toBeInTheDocument()
  })

  it('re-orients the canonical price to the inverted labels instead of printing the reciprocal', () => {
    mockContext({ priceInverted: true })
    renderReviewModal()

    expect(screen.getByText('80.0 USDC = 1 KHYPE')).toBeInTheDocument()
    expect(screen.queryByText('0.0125 USDC = 1 KHYPE')).toBeNull()
  })
})
