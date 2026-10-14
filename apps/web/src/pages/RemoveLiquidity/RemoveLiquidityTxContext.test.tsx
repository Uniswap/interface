import { configureStore } from '@reduxjs/toolkit'
import { renderHook } from '@testing-library/react'
import { DecreasePositionResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { delegationReducer } from 'uniswap/src/features/smartWallet/delegation/slice'
import { useRemoveLiquidityTxAndGasInfo } from '~/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo'
import {
  type CommittedDecrease,
  useRemoveLiquidityModalContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import {
  RemoveLiquidityTxContextProvider,
  type RemoveLiquidityTxInfo,
  useRemoveLiquidityTxContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityTxContext'
import {
  buildDecreaseTxContext,
  buildPositionInfo,
  LIQUIDITY_SERVICE_POSITION_OWNER,
} from '~/test-utils/pools/liquidityServicePositionFixtures'

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
  useActiveAddress: vi.fn(() => LIQUIDITY_SERVICE_POSITION_OWNER),
}))
vi.mock('~/pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo', () => ({
  useRemoveLiquidityTxAndGasInfo: vi.fn(),
}))
vi.mock('~/pages/RemoveLiquidity/RemoveLiquidityModalContext', () => ({
  useRemoveLiquidityModalContext: vi.fn(),
}))

const mockUseRemoveLiquidityTxAndGasInfo = vi.mocked(useRemoveLiquidityTxAndGasInfo)
const mockUseRemoveLiquidityModalContext = vi.mocked(useRemoveLiquidityModalContext)

const DECREASE_TX = { to: '0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e', chainId: 1, data: '0x', value: '0' }
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
// Independent literals: what the service quoted for a 50% decrease of the live position, not derived from the snapshot.
const QUOTED_ETH = '48121955538198294'
const QUOTED_USDT = '129165560'

function mockModalContext({
  positionInfo,
  percent,
  committedDecrease,
}: {
  positionInfo: PositionInfo
  percent: string
  committedDecrease?: CommittedDecrease
}): void {
  mockUseRemoveLiquidityModalContext.mockReturnValue({
    positionInfo,
    percent,
    currencies: { TOKEN0: positionInfo.currency0Amount.currency, TOKEN1: positionInfo.currency1Amount.currency },
    percentInvalid: false,
    step: 0,
    setStep: vi.fn(),
    setPercent: vi.fn(),
    unwrapNativeCurrency: true,
    setUnwrapNativeCurrency: vi.fn(),
    currentTransactionStep: undefined,
    setCurrentTransactionStep: vi.fn(),
    committedDecrease,
    commitDecrease: vi.fn(),
    resetCommittedDecrease: vi.fn(),
    backToInput: vi.fn(),
  })
}

function mockTxAndGasInfo(decreaseCalldata: DecreasePositionResponse | undefined): void {
  mockUseRemoveLiquidityTxAndGasInfo.mockReturnValue({
    decreaseCalldata,
    decreaseCalldataLoading: false,
    approvalLoading: false,
    error: false,
    refetch: vi.fn(),
  })
}

// Besides the two mocked hooks the provider only reads the delegation slice, so a store holding just that slice is
// all it needs.
const store = configureStore({
  reducer: { delegation: delegationReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
})

function renderTxContext(): { current: RemoveLiquidityTxInfo } {
  const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
    <Provider store={store}>
      <RemoveLiquidityTxContextProvider>{children}</RemoveLiquidityTxContextProvider>
    </Provider>
  )
  return renderHook(useRemoveLiquidityTxContext, { wrapper }).result
}

describe('RemoveLiquidityTxContextProvider', () => {
  const positionInfo = buildPositionInfo({ liquidity: '49387053232' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockModalContext({ positionInfo, percent: '50' })
  })

  it('records the amounts the service quoted for the decrease, not a share of the displayed position', () => {
    mockTxAndGasInfo(
      new DecreasePositionResponse({
        // Native ETH is quoted under the zero address; the USDT address comes back in a different case than the Token's.
        token0: { tokenAddress: ZERO_ADDRESS, amount: QUOTED_ETH },
        token1: { tokenAddress: USDT_ADDRESS.toLowerCase(), amount: QUOTED_USDT },
        decrease: DECREASE_TX,
      }),
    )

    const { current } = renderTxContext()

    expect(current.txContext?.action.currency0Amount.quotient.toString()).toBe(QUOTED_ETH)
    expect(current.txContext?.action.currency1Amount.quotient.toString()).toBe(QUOTED_USDT)
    // The quote differs from the snapshot share by construction, so the assertion above is discriminating.
    expect(positionInfo.currency1Amount.divide(2).quotient.toString()).not.toBe(QUOTED_USDT)
    // The review card reads the very same amounts, so the user signs the number they were shown.
    expect(current.currency0AmountToRemove).toBe(current.txContext?.action.currency0Amount)
    expect(current.currency1AmountToRemove).toBe(current.txContext?.action.currency1Amount)
  })

  it('keeps a quoted zero: a drained position legitimately settles nothing', () => {
    mockTxAndGasInfo(
      new DecreasePositionResponse({
        token0: { tokenAddress: ZERO_ADDRESS, amount: '0' },
        token1: { tokenAddress: USDT_ADDRESS, amount: '0' },
        decrease: DECREASE_TX,
      }),
    )

    const { current } = renderTxContext()

    expect(current.txContext?.action.currency0Amount.quotient.toString()).toBe('0')
    expect(current.txContext?.action.currency1Amount.quotient.toString()).toBe('0')
  })

  it('falls back to the displayed position share when the service quotes no amounts', () => {
    // A token with no amount counts as no quote.
    mockTxAndGasInfo(new DecreasePositionResponse({ token0: { tokenAddress: ZERO_ADDRESS }, decrease: DECREASE_TX }))

    const { current } = renderTxContext()

    expect(current.txContext?.action.currency0Amount.quotient.toString()).toBe(
      positionInfo.currency0Amount.divide(2).quotient.toString(),
    )
    expect(current.txContext?.action.currency1Amount.quotient.toString()).toBe(
      positionInfo.currency1Amount.divide(2).quotient.toString(),
    )
    expect(current.currency0AmountToRemove).toBe(current.txContext?.action.currency0Amount)
    expect(current.currency1AmountToRemove).toBe(current.txContext?.action.currency1Amount)
  })

  it('falls back per side when the quoted token is not the currency being removed', () => {
    mockTxAndGasInfo(
      new DecreasePositionResponse({
        token0: { tokenAddress: ZERO_ADDRESS, amount: QUOTED_ETH },
        token1: { tokenAddress: '0x1111111111111111111111111111111111111111', amount: QUOTED_USDT },
        decrease: DECREASE_TX,
      }),
    )

    const { current } = renderTxContext()

    expect(current.txContext?.action.currency0Amount.quotient.toString()).toBe(QUOTED_ETH)
    expect(current.txContext?.action.currency1Amount.quotient.toString()).toBe(
      positionInfo.currency1Amount.divide(2).quotient.toString(),
    )
  })

  it('hands out the committed transaction and its amounts, not a quote that lands after confirm', () => {
    const committed = buildDecreaseTxContext(positionInfo)
    mockModalContext({ positionInfo, percent: '50', committedDecrease: { positionInfo, txContext: committed } })
    mockTxAndGasInfo(
      new DecreasePositionResponse({
        token0: { tokenAddress: ZERO_ADDRESS, amount: QUOTED_ETH },
        token1: { tokenAddress: USDT_ADDRESS, amount: QUOTED_USDT },
        decrease: DECREASE_TX,
      }),
    )

    const { current } = renderTxContext()

    expect(current.txContext).toBe(committed)
    expect(current.currency0AmountToRemove).toBe(committed.action.currency0Amount)
    expect(current.currency1AmountToRemove).toBe(committed.action.currency1Amount)
    expect(current.currency1AmountToRemove?.quotient.toString()).not.toBe(QUOTED_USDT)
  })

  it('exposes the position share for the review card, but no transaction context, while the calldata loads', () => {
    mockTxAndGasInfo(undefined)

    const { current } = renderTxContext()

    expect(current.txContext).toBeUndefined()
    expect(current.decreaseCalldata).toBeUndefined()
    expect(current.currency0AmountToRemove?.quotient.toString()).toBe(
      positionInfo.currency0Amount.divide(2).quotient.toString(),
    )
    expect(current.currency1AmountToRemove?.quotient.toString()).toBe(
      positionInfo.currency1Amount.divide(2).quotient.toString(),
    )
  })
})
