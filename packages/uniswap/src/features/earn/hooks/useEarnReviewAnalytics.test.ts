import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { useEarnReviewAnalytics } from 'uniswap/src/features/earn/hooks/useEarnReviewAnalytics'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)

const VAULT: EarnVaultInfo = {
  id: '1-0xvault',
  currencyId: `${UniverseChainId.Mainnet}-0xunderlying`,
  displayCurrencyId: `${UniverseChainId.Mainnet}-0xunderlying`,
  vaultAddress: '0xvault',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 4.8,
  exposureCurrencyIds: [],
  totalDepositsUsd: 1_000_000,
  liquidityUsd: 500_000,
  curator: { name: 'Morpho' },
}

function renderAnalytics(overrides: Partial<Parameters<typeof useEarnReviewAnalytics>[0]> = {}) {
  return renderHook(() =>
    useEarnReviewAnalytics({
      action: 'deposit',
      amountUsd: 100,
      analyticsEntryPoint: EarnEntryPoint.PostSwapUpsellToast,
      analyticsSurface: EarnAnalyticsSurface.Web,
      tokenAmount: '100',
      vault: VAULT,
      ...overrides,
    }),
  )
}

describe(useEarnReviewAnalytics, () => {
  beforeEach(() => {
    mockSendAnalyticsEvent.mockClear()
  })

  it('logs submitted and converted events when a post-swap upsell deposit is submitted', () => {
    const { result } = renderAnalytics({ sourceUpsellCurrencyId: VAULT.displayCurrencyId, swapAmountUsd: 100 })

    act(() => result.current.logSubmitted())

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnDepositSubmitted,
      expect.objectContaining({ action: 'deposit', amount_usd: 100 }),
    )
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnSwapUpsellConverted,
      expect.objectContaining({
        source_upsell_currency_id: VAULT.displayCurrencyId,
        swap_upsell_surface: 'toast',
        swap_amount_usd: 100,
      }),
    )
  })

  it('logs converted events when a swap-review toggle deposit is submitted', () => {
    const { result } = renderAnalytics({
      analyticsEntryPoint: EarnEntryPoint.SwapReviewToggle,
      sourceUpsellCurrencyId: VAULT.displayCurrencyId,
      swapAmountUsd: 200,
    })

    act(() => result.current.logSubmitted())

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnSwapUpsellConverted,
      expect.objectContaining({
        source_upsell_currency_id: VAULT.displayCurrencyId,
        swap_amount_usd: 200,
        swap_upsell_surface: 'toggle',
      }),
    )
  })

  it('logs immediate failures before plan execution has been submitted', () => {
    const { result } = renderAnalytics()
    const error = new Error('quote failed')
    error.name = 'QuoteError'

    act(() => result.current.logFailed(error))

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnDepositFailed,
      expect.objectContaining({
        error_message: 'quote failed',
        error_name: 'QuoteError',
      }),
    )
  })

  it('merges submitted failure details into the finalized failure event', () => {
    const { result } = renderAnalytics()
    const error = new Error('plan failed')
    error.name = 'PlanError'

    act(() => {
      result.current.logSubmitted()
      result.current.logFailed(error)
      result.current.logFinalized({ planId: 'plan-1', status: TransactionStatus.Failed })
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(3)
    expect(mockSendAnalyticsEvent).toHaveBeenLastCalledWith(
      EarnEventName.EarnDepositFailed,
      expect.objectContaining({
        error_message: 'plan failed',
        error_name: 'PlanError',
        plan_id: 'plan-1',
      }),
    )
  })

  it('logs completed events with the plan id when finalization succeeds', () => {
    const { result } = renderAnalytics()

    act(() => result.current.logFinalized({ planId: 'plan-1', status: TransactionStatus.Success }))

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnDepositCompleted,
      expect.objectContaining({ plan_id: 'plan-1' }),
    )
  })

  it('dedupes finalized events by plan id', () => {
    const { result } = renderAnalytics()

    act(() => {
      result.current.logFinalized({ planId: 'plan-1', status: TransactionStatus.Success })
      result.current.logFinalized({ planId: 'plan-1', status: TransactionStatus.Success })
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      EarnEventName.EarnDepositCompleted,
      expect.objectContaining({ plan_id: 'plan-1' }),
    )
  })
})
