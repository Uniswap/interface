import { TradingApi } from '@universe/api'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { clearPrefetchedPlan, consumePrefetchedPlan, prefetchPlan } from './prefetchedPlanStore'

const mocks = vi.hoisted(() => ({
  createNewPlan: vi.fn(),
  requireAcceptNewTrade: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient', () => ({
  TradingApiSessionClient: {
    createNewPlan: mocks.createNewPlan,
  },
}))

vi.mock('uniswap/src/features/transactions/swap/utils/trade', () => ({
  requireAcceptNewTrade: mocks.requireAcceptNewTrade,
}))

const EARN_INTENT: TradingApi.EarnIntent = {
  action: TradingApi.EarnAction.DEPOSIT,
  vault: '0x0000000000000000000000000000000000000002',
  chainId: TradingApi.ChainId._1,
}
const OTHER_EARN_INTENT: TradingApi.EarnIntent = {
  ...EARN_INTENT,
  vault: '0x0000000000000000000000000000000000000003',
}

const PLAN_RESPONSE = {
  planId: 'plan-1',
  requestId: 'request-1',
  quoteId: 'quote-1',
  expectedOutput: '100',
  swapper: '0xswapper',
  recipient: '0xrecipient',
  status: TradingApi.PlanStatus.ACTIVE,
  currentStepIndex: 0,
  steps: [],
} satisfies TradingApi.PlanResponse

describe('prefetchedPlanStore', () => {
  beforeEach(() => {
    clearPrefetchedPlan()
    mocks.createNewPlan.mockResolvedValue(PLAN_RESPONSE)
    mocks.requireAcceptNewTrade.mockReturnValue(false)
  })

  afterEach(() => {
    clearPrefetchedPlan()
    vi.clearAllMocks()
  })

  it('includes earn intent when prefetching an Earn plan', () => {
    const trade = createChainedTrade({ earnIntent: EARN_INTENT })

    prefetchPlan(trade)

    expect(TradingApiSessionClient.createNewPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        routing: TradingApi.Routing.CHAINED,
        earnIntent: EARN_INTENT,
      }),
    )
  })

  it('does not include earn intent when prefetching a non-Earn plan', () => {
    const trade = createChainedTrade()

    prefetchPlan(trade)

    expect(TradingApiSessionClient.createNewPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        earnIntent: undefined,
      }),
    )
  })

  it('does not consume an Earn prefetch for a non-Earn current trade', async () => {
    prefetchPlan(createChainedTrade({ earnIntent: EARN_INTENT }))

    await expect(consumePrefetchedPlan(createChainedTrade())).resolves.toBeNull()
    expect(requireAcceptNewTrade).not.toHaveBeenCalled()
  })

  it('does not consume a non-Earn prefetch for an Earn current trade', async () => {
    prefetchPlan(createChainedTrade())

    await expect(consumePrefetchedPlan(createChainedTrade({ earnIntent: EARN_INTENT }))).resolves.toBeNull()
    expect(requireAcceptNewTrade).not.toHaveBeenCalled()
  })

  it('does not consume an Earn prefetch for a different vault', async () => {
    prefetchPlan(createChainedTrade({ earnIntent: EARN_INTENT }))

    await expect(consumePrefetchedPlan(createChainedTrade({ earnIntent: OTHER_EARN_INTENT }))).resolves.toBeNull()
    expect(requireAcceptNewTrade).not.toHaveBeenCalled()
  })

  it('keeps existing non-Earn prefetch behavior when quote ids differ', async () => {
    prefetchPlan(createChainedTrade({ quoteId: 'quote-1' }))

    await expect(consumePrefetchedPlan(createChainedTrade({ quoteId: 'quote-2' }))).resolves.toBe(PLAN_RESPONSE)
    expect(requireAcceptNewTrade).toHaveBeenCalled()
  })
})

function createChainedTrade({
  earnIntent,
  quoteId = 'quote-1',
}: { earnIntent?: TradingApi.EarnIntent; quoteId?: string } = {}): Trade {
  const quote = {
    input: { amount: '100', token: '0xinput' },
    output: { amount: '100', token: '0xoutput', recipient: '0xrecipient' },
    swapper: '0xswapper',
    tokenInChainId: TradingApi.ChainId._1,
    tokenOutChainId: TradingApi.ChainId._1,
    tradeType: TradingApi.TradeType.EXACT_INPUT,
    quoteId,
    gasFee: '0',
    gasFeeUSD: '0',
    gasFeeQuote: '0',
    gasUseEstimate: '0',
    gasStrategies: [],
    steps: [],
    earnIntent,
  }

  return {
    routing: TradingApi.Routing.CHAINED,
    quote: {
      routing: TradingApi.Routing.CHAINED,
      requestId: 'request-1',
      permitData: null,
      quote,
    },
    earnIntent,
  } as unknown as Trade
}
