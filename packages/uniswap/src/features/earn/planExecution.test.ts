import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { USDC } from 'uniswap/src/constants/tokens'
import { buildEarnPlanAnalytics } from 'uniswap/src/features/earn/planExecution'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'

const VAULT_ADDRESS = '0x0000000000000000000000000000000000000002'

describe(buildEarnPlanAnalytics, () => {
  it('preserves zero slippage when building analytics', () => {
    const analytics = buildEarnPlanAnalytics(createTrade({ slippageTolerance: 0 }))

    expect(analytics.allowed_slippage).toBe(0)
    expect(analytics.allowed_slippage_basis_points).toBe(0)
  })

  it('includes Earn intent fields for deposits', () => {
    const analytics = buildEarnPlanAnalytics(createTrade({ slippageTolerance: 0 }))

    expect(analytics).toEqual(
      expect.objectContaining({
        earn_action: TradingApi.EarnAction.DEPOSIT,
        earn_vault_address: VAULT_ADDRESS,
        earn_vault_chain_id: TradingApi.ChainId._1,
        earn_withdraw_mode: undefined,
      }),
    )
  })

  it('includes Earn withdraw mode for withdrawals', () => {
    const analytics = buildEarnPlanAnalytics(
      createTrade({
        earnIntent: {
          action: TradingApi.EarnAction.WITHDRAW,
          chainId: TradingApi.ChainId._1,
          vault: VAULT_ADDRESS,
          withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
        },
        slippageTolerance: 0,
      }),
    )

    expect(analytics).toEqual(
      expect.objectContaining({
        earn_action: TradingApi.EarnAction.WITHDRAW,
        earn_vault_address: VAULT_ADDRESS,
        earn_vault_chain_id: TradingApi.ChainId._1,
        earn_withdraw_mode: TradingApi.EarnWithdrawMode.MAX_SHARES,
      }),
    )
  })
})

function createTrade({
  earnIntent = {
    action: TradingApi.EarnAction.DEPOSIT,
    vault: VAULT_ADDRESS,
    chainId: TradingApi.ChainId._1,
  },
  slippageTolerance,
}: {
  earnIntent?: TradingApi.EarnIntent
  slippageTolerance: number
}): ChainedActionTrade {
  return {
    earnIntent,
    inputAmount: createCurrencyAmount('1'),
    outputAmount: createCurrencyAmount('1'),
    maxAmountIn: createCurrencyAmount('1'),
    minAmountOut: createCurrencyAmount('1'),
    quote: {
      requestId: 'request-1',
      quote: {
        quoteId: 'quote-1',
      },
    },
    slippageTolerance,
    tradeType: TradeType.EXACT_INPUT,
  } as unknown as ChainedActionTrade
}

function createCurrencyAmount(exact: string): {
  currency: typeof USDC
  toExact: () => string
} {
  return {
    currency: USDC,
    toExact: () => exact,
  }
}
