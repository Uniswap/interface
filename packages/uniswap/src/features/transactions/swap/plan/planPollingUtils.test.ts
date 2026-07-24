import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pollPlanStatus } from 'uniswap/src/features/transactions/swap/plan/planPollingUtils'
import {
  PlanTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const mocks = vi.hoisted(() => ({
  getExistingPlan: vi.fn(),
  extractPlanResponseDetails: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient', () => ({
  TradingApiSessionClient: {
    getExistingPlan: mocks.getExistingPlan,
  },
}))

vi.mock('uniswap/src/features/activity/extract/extractPlanResponseDetails', () => ({
  default: mocks.extractPlanResponseDetails,
}))

const ADDRESS = '0x0000000000000000000000000000000000000001' as Address
const INPUT_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0x6B175474E89094C44Da98b954EedeAC495271d0F')
const OUTPUT_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

function createPlanTransaction(overrides: Partial<PlanTransactionDetails> = {}): PlanTransactionDetails {
  return {
    routing: TradingApi.Routing.CHAINED,
    id: 'plan-1',
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    updatedTime: Date.now(),
    from: ADDRESS,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: {
      type: TransactionType.Plan,
      planId: 'plan-1',
      planStatus: TradingApi.PlanStatus.ACTIVE,
      stepDetails: [],
      tokenOutChainId: UniverseChainId.Mainnet,
      inputCurrencyId: INPUT_CURRENCY_ID,
      outputCurrencyId: OUTPUT_CURRENCY_ID,
      inputCurrencyAmountRaw: '100',
      outputCurrencyAmountRaw: '100',
      tradeType: TradeType.EXACT_INPUT,
    },
    ...overrides,
  }
}

describe(pollPlanStatus, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('polls non-Earn stored plans by plan ID', async () => {
    const localPlan = createPlanTransaction()
    const remotePlanResponse = { planId: 'plan-1' } as TradingApi.PlanResponse
    mocks.getExistingPlan.mockResolvedValue(remotePlanResponse)
    mocks.extractPlanResponseDetails.mockReturnValue(localPlan)

    await pollPlanStatus(localPlan)

    expect(mocks.getExistingPlan).toHaveBeenCalledWith({
      planId: 'plan-1',
    })
  })

  it('polls Earn stored plans by plan ID', async () => {
    const localPlan = createPlanTransaction()
    localPlan.typeInfo.earnAction = TradingApi.EarnAction.DEPOSIT
    const remotePlanResponse = { planId: 'plan-1' } as TradingApi.PlanResponse
    mocks.getExistingPlan.mockResolvedValue(remotePlanResponse)
    mocks.extractPlanResponseDetails.mockReturnValue(localPlan)

    await pollPlanStatus(localPlan)

    expect(mocks.getExistingPlan).toHaveBeenCalledWith({
      planId: 'plan-1',
    })
  })
})
