import { TradingApi } from '@universe/api'
import extractPlanResponseDetails from 'uniswap/src/features/activity/extract/extractPlanResponseDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

describe(extractPlanResponseDetails, () => {
  it('records the Earn action from TAPI plan responses', () => {
    const plan = extractPlanResponseDetails({
      planId: 'plan-1',
      swapper: '0x0000000000000000000000000000000000000001',
      status: TradingApi.PlanStatus.ACTIVE,
      createdAt: '2026-06-01T00:00:00.000Z',
      steps: [
        {
          stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
          status: TradingApi.PlanStepStatus.AWAITING_ACTION,
          tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          tokenInChainId: TradingApi.ChainId._1,
          tokenInAmount: '1000000',
          tokenOut: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
          tokenOutChainId: TradingApi.ChainId._1,
          tokenOutAmount: '1000000000000000000',
        },
      ],
      earnIntent: {
        action: TradingApi.EarnAction.DEPOSIT,
        vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
        chainId: TradingApi.ChainId._1,
      },
    } as TradingApi.PlanResponse)

    expect(plan?.typeInfo).toEqual(
      expect.objectContaining({
        type: TransactionType.Plan,
        earnAction: TradingApi.EarnAction.DEPOSIT,
      }),
    )
  })
})
