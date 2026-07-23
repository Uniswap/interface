import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse, TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { planActions } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'
import { useEarnSagaCallback } from '~/features/earn/hooks/useEarnSagaCallback'

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  selectChain: vi.fn(),
  useActiveAccount: vi.fn(),
  useAccountsStore: vi.fn(),
}))

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAccount: mocks.useActiveAccount,
  useAccountsStore: mocks.useAccountsStore,
}))

vi.mock('~/hooks/useSelectChain', () => ({
  useSelectChain: () => mocks.selectChain,
}))

vi.mock('~/state/sagas/transactions/earnSaga', () => ({
  handleEarnPlanTransactionStep: vi.fn(),
  handleEarnPlanWalletCallStep: vi.fn(),
}))

vi.mock('~/state/sagas/transactions/uniswapx', () => ({
  handleUniswapXPlanSignatureStep: vi.fn(),
}))

vi.mock('~/state/sagas/transactions/utils', () => ({
  getDisplayableError: vi.fn(),
  handleApprovalTransactionStep: vi.fn(),
  handleSignatureStep: vi.fn(),
  sendToast: vi.fn(),
}))

const ACCOUNT = {
  address: '0x0000000000000000000000000000000000000001' as Address,
}
const USDC = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const VAULT_ADDRESS = '0x0000000000000000000000000000000000000002' as Address
const EARN_INTENT: TradingApi.EarnIntent = {
  action: TradingApi.EarnAction.DEPOSIT,
  vault: VAULT_ADDRESS,
  chainId: TradingApi.ChainId._1,
}
const QUOTE_RESPONSE: ChainedQuoteResponse = {
  routing: TradingApi.Routing.CHAINED,
  requestId: 'request-1',
  permitData: null,
  quote: {
    input: { amount: '1000000', token: USDC.address },
    output: {
      amount: '1000000',
      token: VAULT_ADDRESS,
      recipient: ACCOUNT.address,
    },
    swapper: ACCOUNT.address,
    tokenInChainId: TradingApi.ChainId._1,
    tokenOutChainId: TradingApi.ChainId._1,
    tradeType: TradingApi.TradeType.EXACT_INPUT,
    quoteId: 'quote-1',
    gasFee: '0',
    gasFeeUSD: '0',
    gasFeeQuote: '0',
    gasUseEstimate: '0',
    timeEstimateMs: 0,
    gasStrategies: [],
    steps: [],
    // Deposit earn quotes always carry a preview; without one there is no displayable underlying
    // amount (the raw output is vault-share denominated) and trade creation intentionally fails.
    earnPreview: {
      type: TradingApi.EarnDepositPreview.type.DEPOSIT,
      depositAssets: [{ token: USDC.address, chainId: TradingApi.ChainId._1, amount: '1000000' }],
      estimatedSharesOut: '1000000',
    },
  },
}

describe('useEarnSagaCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activePlanStore.setState({ activePlan: undefined, priceChangeInterruptedPlanIds: new Set() })
    mocks.useActiveAccount.mockReturnValue(ACCOUNT)
    mocks.useAccountsStore.mockImplementation(
      (selector: (state: { getActiveConnector: () => { session: { caip25Info: undefined } } }) => unknown) =>
        selector({
          getActiveConnector: () => ({ session: { caip25Info: undefined } }),
        }),
    )
  })

  it('dispatches the shared plan saga for Earn execution', () => {
    const { result } = renderHook(() => useEarnSagaCallback())
    const onSuccess = vi.fn()
    const onFailure = vi.fn()
    const onSubmitted = vi.fn()

    result.current({
      earnIntent: EARN_INTENT,
      inputCurrency: USDC,
      outputCurrency: USDC,
      quote: QUOTE_RESPONSE,
      onSuccess,
      onFailure,
      onSubmitted,
    })

    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: planActions.trigger.type }))
    expect(onSubmitted).toHaveBeenCalledTimes(1)
    const action = mocks.dispatch.mock.calls[0]?.[0] as ReturnType<typeof planActions.trigger>
    const trade = action.payload.swapTxContext.trade as ChainedActionTrade
    expect(action.payload.swapTxContext.routing).toBe(TradingApi.Routing.CHAINED)
    expect(trade.routing).toBe(TradingApi.Routing.CHAINED)
    expect(trade.earnIntent).toEqual(EARN_INTENT)
    expect(action.payload.modalClosedActionType).toBe(signalEarnModalClosed.type)
    expect(action.payload.onSuccess).toBe(onSuccess)
    expect(action.payload.onFailure).toBe(onFailure)
    expect(action.payload.getOnPressRetry).toBeUndefined()
  })

  it('does not dispatch without an active EVM account', () => {
    mocks.useActiveAccount.mockReturnValue(undefined)
    const { result } = renderHook(() => useEarnSagaCallback())
    const onFailure = vi.fn()
    const onSubmitted = vi.fn()

    result.current({
      earnIntent: EARN_INTENT,
      inputCurrency: USDC,
      outputCurrency: USDC,
      quote: QUOTE_RESPONSE,
      onSuccess: vi.fn(),
      onFailure,
      onSubmitted,
    })

    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledWith(expect.any(Error))
  })

  it('dispatches when a plan is active so the shared plan saga can resume or validate compatibility', () => {
    activePlanStore.setState({
      activePlan: {
        planId: 'active-plan',
        response: {
          planId: 'active-plan',
          steps: [],
        } as unknown as TradingApi.PlanResponse,
        steps: [],
        currentStepIndex: 0,
        inputChainId: UniverseChainId.Mainnet,
        proofPending: false,
      },
    })
    activePlanStore.getState().actions.markPlanPriceChangeInterrupted('active-plan')
    const { result } = renderHook(() => useEarnSagaCallback())
    const onFailure = vi.fn()

    result.current({
      earnIntent: EARN_INTENT,
      inputCurrency: USDC,
      outputCurrency: USDC,
      quote: QUOTE_RESPONSE,
      onSuccess: vi.fn(),
      onFailure,
    })

    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: planActions.trigger.type }))
    expect(onFailure).not.toHaveBeenCalled()
    expect(activePlanStore.getState().priceChangeInterruptedPlanIds.has('active-plan')).toBe(false)
  })

  it('reports malformed quote errors instead of throwing from the press handler', () => {
    const { result } = renderHook(() => useEarnSagaCallback())
    const onFailure = vi.fn()
    const onSubmitted = vi.fn()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const malformedQuote = {
      ...QUOTE_RESPONSE,
      quote: {
        ...QUOTE_RESPONSE.quote,
        input: { ...QUOTE_RESPONSE.quote.input, amount: 'not-a-raw-amount' },
      },
    } as ChainedQuoteResponse

    expect(() =>
      result.current({
        earnIntent: EARN_INTENT,
        inputCurrency: USDC,
        outputCurrency: USDC,
        quote: malformedQuote,
        onSuccess: vi.fn(),
        onFailure,
        onSubmitted,
      }),
    ).not.toThrow()

    expect(mocks.dispatch).not.toHaveBeenCalled()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledWith(expect.any(Error))
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})
