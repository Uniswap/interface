import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { PlanStepItem } from 'uniswap/src/components/activity/details/plan/PlanStepItem'
import { createTransactionDetails } from 'uniswap/src/features/activity/extract/extractPlanUtils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { renderWithProviders } from 'uniswap/src/test/render'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'uniswap/src/utils/currencyId'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn((): null => null),
}))

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'
const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006'
const nativeId = buildNativeCurrencyId(UniverseChainId.Base)
const wrappedId = buildWrappedNativeCurrencyId(UniverseChainId.Base)

describe(PlanStepItem, () => {
  beforeEach(() => {
    vi.mocked(useCurrencyInfo).mockClear()
  })

  it.each([
    {
      planStepType: TradingApi.PlanStepType.WRAP,
      routing: TradingApi.Routing.WRAP,
      tokenIn: NATIVE_ADDRESS,
      tokenOut: BASE_WETH_ADDRESS,
      text: 'transaction.status.plan.step.wrap',
      spent: nativeId,
      received: wrappedId,
    },
    {
      planStepType: TradingApi.PlanStepType.UNWRAP,
      routing: TradingApi.Routing.UNWRAP,
      tokenIn: BASE_WETH_ADDRESS,
      tokenOut: NATIVE_ADDRESS,
      text: 'transaction.status.plan.step.unwrap',
      spent: wrappedId,
      received: nativeId,
    },
  ])(
    'describes a $planStepType step as $text, in the token it spends',
    ({ planStepType, routing, tokenIn, tokenOut, text, spent, received }) => {
      const transactionDetails = createTransactionDetails({
        routing,
        planId: 'plan-1',
        status: TransactionStatus.Success,
        planStepType,
        inputCurrencyAmountRaw: '200000000000000000',
        outputCurrencyAmountRaw: '200000000000000000',
        addedTime: 0,
        from: '0x0000000000000000000000000000000000000001',
        hash: undefined,
        tokenInChainId: UniverseChainId.Base,
        tokenInAddress: tokenIn,
        tokenOutChainId: UniverseChainId.Base,
        tokenOutAddress: tokenOut,
      })
      if (!transactionDetails) {
        throw new Error('Expected wrap step details')
      }

      const { queryByText } = renderWithProviders(<PlanStepItem transactionDetails={transactionDetails} />)

      expect(queryByText(text)).toBeTruthy()
      expect(useCurrencyInfo).toHaveBeenCalledWith(spent)
      expect(useCurrencyInfo).not.toHaveBeenCalledWith(received)
    },
  )
})
