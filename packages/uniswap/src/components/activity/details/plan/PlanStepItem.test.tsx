import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { PlanStepItem } from 'uniswap/src/components/activity/details/plan/PlanStepItem'
import { createTransactionDetails } from 'uniswap/src/features/activity/extract/extractPlanUtils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  type TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  type TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
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

  it.each([
    { bridgeProvider: TradingApi.BridgeProvider.RELAY, text: 'transaction.status.plan.step.bridge.via' },
    { bridgeProvider: TradingApi.BridgeProvider.ACROSS, text: 'transaction.status.plan.step.bridge' },
    { bridgeProvider: undefined, text: 'transaction.status.plan.step.bridge' },
    // A vendor added to the API after this client shipped.
    { bridgeProvider: 'LIFI' as TradingApi.BridgeProvider, text: 'transaction.status.plan.step.bridge' },
  ])('describes a bridge step served by $bridgeProvider as $text', ({ bridgeProvider, text }) => {
    const transactionDetails = createTransactionDetails({
      routing: TradingApi.Routing.BRIDGE,
      planId: 'plan-1',
      status: TransactionStatus.Pending,
      planStepType: TradingApi.PlanStepType.BRIDGE,
      inputCurrencyAmountRaw: '100000000',
      outputCurrencyAmountRaw: '99900000',
      addedTime: 0,
      from: '0x0000000000000000000000000000000000000001',
      hash: undefined,
      tokenInChainId: UniverseChainId.Base,
      tokenInAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      tokenOutChainId: UniverseChainId.Mainnet,
      tokenOutAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      bridgeProvider,
    })
    if (!transactionDetails) {
      throw new Error('Expected bridge step details')
    }

    const { queryByText } = renderWithProviders(<PlanStepItem transactionDetails={transactionDetails} />)

    expect(queryByText(text)).toBeTruthy()
  })

  describe('in a margin plan', () => {
    const marginOpen: TransactionTypeInfo = {
      type: TransactionType.MarginOpenPosition,
      marketKey: 'market',
      collateralToken: BASE_WETH_ADDRESS,
      debtToken: NATIVE_ADDRESS,
      marginAmount: '1',
      leverageX18: '0',
      collateralToBuy: '0',
      maxDebtIn: '0',
    }
    const unknown: TransactionTypeInfo = { type: TransactionType.Unknown }

    function step(typeInfo: TransactionTypeInfo): TransactionDetails {
      return {
        routing: TradingApi.Routing.CLASSIC,
        id: '0xhash',
        hash: '0xhash',
        chainId: UniverseChainId.Base,
        from: '0x0000000000000000000000000000000000000001',
        status: TransactionStatus.Success,
        addedTime: 0,
        transactionOriginType: TransactionOriginType.Internal,
        options: { request: {} },
        typeInfo,
      }
    }

    it.each([
      { action: 'open', typeInfo: marginOpen, text: 'margin.plan.step.open' },
      { action: 'open', typeInfo: unknown, text: 'margin.plan.step.open' },
      { action: 'close', typeInfo: unknown, text: 'margin.plan.title.close' },
      { action: 'addEquity', typeInfo: unknown, text: 'margin.plan.title.addMargin' },
      { action: 'withdrawEquity', typeInfo: unknown, text: 'margin.plan.title.withdrawMargin' },
      { action: 'increaseLeverage', typeInfo: unknown, text: 'margin.plan.title.increaseLeverage' },
      { action: 'decreaseLeverage', typeInfo: unknown, text: 'margin.plan.title.decreaseLeverage' },
      { action: undefined, typeInfo: unknown, text: 'margin.plan.title.adjust' },
    ] as const)('labels a $typeInfo.type step of a $action plan as $text', ({ action, typeInfo, text }) => {
      const marginAction = { action, collateralCurrencyId: wrappedId ?? '', debtCurrencyId: nativeId }
      const { queryByText } = renderWithProviders(
        <PlanStepItem transactionDetails={step(typeInfo)} marginAction={marginAction} />,
      )

      expect(queryByText(text)).toBeTruthy()
    })

    it('leaves an untyped step blank outside a margin plan', () => {
      const { queryByText } = renderWithProviders(<PlanStepItem transactionDetails={step(unknown)} />)

      expect(queryByText('margin.plan.title.adjust')).toBeNull()
    })
  })
})
