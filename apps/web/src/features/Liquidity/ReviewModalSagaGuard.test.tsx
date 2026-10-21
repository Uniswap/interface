import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SagaStatus } from 'uniswap/src/utils/saga'
import { ReviewModal } from '~/features/Liquidity/ReviewModal'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import store from '~/state'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'
import { act, render, screen } from '~/test-utils/render'

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
// Presentation-only children: none of them carry any part of the confirm gate, and stubbing them keeps
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

const PENDING_WALLET_ACTION = 'Confirm or cancel the pending request in your wallet to continue'
const CONFIRM_LABEL = 'Create'

function amount(currency: Currency): CurrencyAmount<Currency> {
  // String, not a native BigInt: the SDK routes through jsbi, which rejects BigInt inputs.
  return CurrencyAmount.fromRawAmount(currency, `1${'0'.repeat(currency.decimals)}`)
}

function mockGeoRestriction(): void {
  mockedUseLPGeoRestriction.mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
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
  const label = screen.getByText(CONFIRM_LABEL)
  const button = label.closest('button')
  expect(button).not.toBeNull()
  return button as HTMLButtonElement
}

describe('ReviewModal confirm while a liquidity saga is running', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext()
    mockGeoRestriction()
    store.dispatch(liquiditySaga.actions.reset())
  })

  afterAll(() => {
    store.dispatch(liquiditySaga.actions.reset())
  })

  it('confirms normally when no liquidity saga is running', () => {
    renderReviewModal()

    expect(confirmButton()).not.toBeDisabled()
    expect(screen.queryByText(PENDING_WALLET_ACTION)).toBeNull()
  })

  // Re-opening review after Back (or after closing the modal) mounts fresh local step state, so only the
  // saga's own status knows a wallet request from the previous confirm is still open.
  it('disables confirm and explains why while a previous saga is still running', () => {
    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Started))
    })
    renderReviewModal()

    expect(confirmButton()).toBeDisabled()
    expect(screen.getByText(PENDING_WALLET_ACTION)).toBeInTheDocument()
  })

  it('re-enables confirm once the previous saga ends', () => {
    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Started))
    })
    renderReviewModal()
    expect(confirmButton()).toBeDisabled()

    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Success))
    })

    expect(confirmButton()).not.toBeDisabled()
    expect(screen.queryByText(PENDING_WALLET_ACTION)).toBeNull()
  })
})
