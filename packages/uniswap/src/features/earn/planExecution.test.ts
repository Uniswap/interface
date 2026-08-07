import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { USDC } from 'uniswap/src/constants/tokens'
import {
  buildEarnPlanAnalytics,
  createEarnPlanFailureCallback,
  EarnPlanUnavailableError,
  EarnPlanPriceChangeError,
  getEarnExecutionErrorMessage,
  shouldShowEarnTroubleshootingLink,
} from 'uniswap/src/features/earn/planExecution'
import type { PlanFailureCallbackContext } from 'uniswap/src/features/transactions/swap/plan/types'
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

describe(createEarnPlanFailureCallback, (): void => {
  it.each([false, true])(
    'forwards failure context with willFinalize=%s while preserving the UI retry callback',
    (willFinalize: boolean): void => {
      const error = new Error('Plan failed')
      const retry = vi.fn()
      const handleFailure = vi.fn((_error?: Error, _retry?: () => void): void => undefined)
      const logFailed = vi.fn((_error: Error | undefined, _context?: PlanFailureCallbackContext): void => undefined)
      const onFailure = createEarnPlanFailureCallback({ handleFailure, logFailed })
      const context = { willFinalize }

      onFailure(error, retry, context)

      expect(logFailed).toHaveBeenCalledWith(error, context)
      expect(handleFailure).toHaveBeenCalledWith(error, retry)
    },
  )
})

describe(shouldShowEarnTroubleshootingLink, () => {
  it('shows troubleshooting help for transaction failures', () => {
    expect(shouldShowEarnTroubleshootingLink(new Error('Transaction failed'))).toBe(true)
  })

  it.each([
    Object.assign(new Error('Rejected by wallet'), { code: 4001 }),
    new Error('User denied the request'),
    new Error('Transaction cancelled'),
  ])('hides troubleshooting help for wallet rejection %#', (error) => {
    expect(shouldShowEarnTroubleshootingLink(error)).toBe(false)
  })

  it('hides troubleshooting help for price-change interruptions', () => {
    expect(shouldShowEarnTroubleshootingLink(new EarnPlanPriceChangeError('Review the updated quote'))).toBe(false)
  })

  it('hides troubleshooting help when Earn is unavailable', () => {
    expect(shouldShowEarnTroubleshootingLink(new EarnPlanUnavailableError('Earn is currently unavailable.'))).toBe(
      false,
    )
  })
})

describe(getEarnExecutionErrorMessage, () => {
  it('preserves the displayable Earn-unavailable message', () => {
    expect(
      getEarnExecutionErrorMessage({
        error: new EarnPlanUnavailableError('Earn is currently unavailable.'),
        fallback: 'Transaction failed. Please try again.',
      }),
    ).toBe('Earn is currently unavailable.')
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
