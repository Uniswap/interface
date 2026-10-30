import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { InitialPriceAcceptance } from '~/features/Liquidity/Create/hooks/useInitialPriceAcceptance'
import { ReviewModal } from '~/features/Liquidity/ReviewModal'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { fireEvent, render, screen } from '~/test-utils/render'

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
vi.mock('~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart', () => ({
  getLiquidityRangeChartProps: () => undefined,
  WrappedLiquidityPositionRangeChart: () => null,
}))
vi.mock('~/features/Liquidity/LowLPSlippageWarning', () => ({ LowLPSlippageWarning: () => null }))
vi.mock('~/features/Liquidity/PartialMigrationWarning', () => ({ PartialMigrationWarning: () => null }))
vi.mock('~/features/Liquidity/Create/PoolOutOfSyncError', () => ({ PoolOutOfSyncError: () => null }))
vi.mock('~/features/Liquidity/LiquidityPositionInfoBadges', () => ({ LiquidityPositionInfoBadges: () => null }))
vi.mock('~/features/Liquidity/BaseQuoteFiatAmount', () => ({ BaseQuoteFiatAmount: () => null }))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const WETH = new Token(1, '0x0000000000000000000000000000000000000a11', 18, 'WETH')
const USDC = new Token(1, '0x0000000000000000000000000000000000000b22', 6, 'USDC')
const CONFIRM_LABEL = 'Create'
const MARKET_UPDATED = 'Market price updated'

function amount(currency: Currency): CurrencyAmount<Currency> {
  return CurrencyAmount.fromRawAmount(currency, `1${'0'.repeat(currency.decimals)}`)
}

function usdcPerWeth(usdc: number): Price<Currency, Currency> {
  return new Price(WETH, USDC, `1${'0'.repeat(WETH.decimals)}`, `${usdc}${'0'.repeat(USDC.decimals)}`)
}

function mockContext(): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    currencies: { display: { TOKEN0: WETH, TOKEN1: USDC }, sdk: { TOKEN0: WETH, TOKEN1: USDC } },
    protocolVersion: ProtocolVersion.V4,
    creatingPoolOrPair: true,
    positionState: { fee: undefined, hook: undefined },
    protocolFee: undefined,
    currentTransactionStep: undefined,
    price: usdcPerWeth(2000),
    poolOrPair: { id: 'pool-id' },
    ticks: [-60, 60],
    priceRangeState: { priceInverted: false, fullRange: true, minTick: -60, maxTick: 60, initialPrice: '2000' },
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function acceptance({ requiresAcceptance }: { requiresAcceptance: boolean }): InitialPriceAcceptance {
  return {
    updatedPrice: usdcPerWeth(requiresAcceptance ? 2030 : 2010),
    priceChangePercent: requiresAcceptance ? 1.5 : 0.5,
    requiresAcceptance,
    acceptUpdatedPrice: vi.fn(),
  }
}

function renderReviewModal(initialPriceAcceptance?: InitialPriceAcceptance, onConfirm = vi.fn()) {
  render(
    <ReviewModal
      initialPriceAcceptance={initialPriceAcceptance}
      modalName={ModalName.CreatePosition}
      headerTitle="Create position"
      confirmButtonText={CONFIRM_LABEL}
      currencyAmounts={{ TOKEN0: amount(WETH), TOKEN1: amount(USDC) }}
      isDisabled={false}
      transactionError={false}
      steps={[]}
      isOpen
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  )
  return { onConfirm }
}

function confirmButton(): HTMLButtonElement {
  const button = screen.getByText(CONFIRM_LABEL).closest('button')
  expect(button).not.toBeNull()
  return button as HTMLButtonElement
}

describe('ReviewModal when a new pool’s market price moves under review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext()
  })

  it('creates at the reviewed price when the market has moved within 1%', () => {
    const { onConfirm } = renderReviewModal(acceptance({ requiresAcceptance: false }))

    expect(screen.queryByText(MARKET_UPDATED)).toBeNull()
    expect(confirmButton()).not.toBeDisabled()
    fireEvent.click(confirmButton())
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('blocks create and offers the new price once the market moves past 1%', () => {
    const blocked = acceptance({ requiresAcceptance: true })
    const { onConfirm } = renderReviewModal(blocked)

    expect(screen.getByText(MARKET_UPDATED)).toBeInTheDocument()
    expect(screen.getByText(/\+1\.50%/)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
    fireEvent.click(confirmButton())
    expect(onConfirm).not.toHaveBeenCalled()

    // Sized to its label: the Button's default `fill` (`flex-1 basis-0`) collapses it to a sliver in this row.
    const acceptButton = screen.getByText('Accept').closest('button')
    expect(acceptButton?.className).toContain('shrink-0')
    expect(acceptButton?.className).not.toContain('basis-0')

    fireEvent.click(screen.getByText('Accept'))
    expect(blocked.acceptUpdatedPrice).toHaveBeenCalledTimes(1)
  })

  // Existing-pool callers (and the shared modal's other tests) pass nothing: no row, no extra gate.
  it('adds no gate when the caller passes no acceptance', () => {
    const { onConfirm } = renderReviewModal(undefined)

    expect(screen.queryByText(MARKET_UPDATED)).toBeNull()
    fireEvent.click(confirmButton())
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
