import { type Currency } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse } from '@universe/api'
import { useCallback, useMemo, useRef } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  EarnEntryPoint,
  EarnSwapUpsellSurface,
  getEarnVaultAnalyticsProperties,
  getProjectedMonthlyEarningsUsd,
  logEarnSwapUpsellConverted,
  logEarnTransactionEvent,
} from 'uniswap/src/features/earn/analytics'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type {
  EarnAnalyticsAction,
  EarnAnalyticsEntryPoint,
  EarnAnalyticsSurface,
  EarnTransactionAnalyticsProperties,
} from 'uniswap/src/features/telemetry/types'
import type { PlanFinalizedCallbackParams } from 'uniswap/src/features/transactions/swap/plan/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'

function getQuoteGasFeeUsd(quote: ChainedQuoteResponse | undefined): string | undefined {
  // Generated types use gasFeeUSD; live REST chained quotes can return gasFeeUsd.
  return (
    quote?.quote.gasFeeUSD ??
    (quote?.quote as (ChainedQuoteResponse['quote'] & { gasFeeUsd?: string }) | undefined)?.gasFeeUsd
  )
}

function getSwapUpsellSurfaceForEntryPoint(
  entryPoint: EarnAnalyticsEntryPoint,
): (typeof EarnSwapUpsellSurface)[keyof typeof EarnSwapUpsellSurface] | undefined {
  if (entryPoint === EarnEntryPoint.SwapReviewToggle) {
    return EarnSwapUpsellSurface.Toggle
  }
  if (entryPoint === EarnEntryPoint.PostSwapUpsellToast) {
    return EarnSwapUpsellSurface.Toast
  }
  return undefined
}

function isFinalizedFailureStatus(status: TransactionStatus | undefined): boolean {
  return (
    status === TransactionStatus.Canceled ||
    status === TransactionStatus.Expired ||
    status === TransactionStatus.Failed ||
    status === TransactionStatus.FailedCancel ||
    status === TransactionStatus.InsufficientFunds
  )
}

function getErrorAnalyticsProperties(
  error: Error | undefined,
): Pick<EarnTransactionAnalyticsProperties, 'error_message' | 'error_name'> {
  return {
    error_message: error?.message,
    error_name: error?.name,
  }
}

export function useEarnReviewAnalytics({
  action,
  amountUsd,
  analyticsEntryPoint,
  analyticsSurface,
  destinationChainId,
  destinationCurrency,
  destinationTokenAddress,
  destinationTokenSymbol,
  originatingTransactionId,
  position,
  projectedMonthlyEarningsUsd,
  quote,
  sourceChainId,
  sourceCurrency,
  sourceUpsellCurrencyId,
  sourceTokenAddress,
  sourceTokenSymbol,
  swapAmountUsd,
  tokenAmount,
  underlyingTokenSymbol,
  vault,
  withdrawMode,
}: {
  action: EarnAnalyticsAction
  amountUsd: number
  analyticsEntryPoint: EarnAnalyticsEntryPoint
  analyticsSurface: EarnAnalyticsSurface
  destinationChainId?: UniverseChainId
  destinationCurrency?: Currency
  destinationTokenAddress?: string
  destinationTokenSymbol?: string
  originatingTransactionId?: string
  position?: EarnPositionInfo
  projectedMonthlyEarningsUsd?: number
  quote?: ChainedQuoteResponse
  sourceChainId?: UniverseChainId
  sourceCurrency?: Currency
  sourceUpsellCurrencyId?: string
  sourceTokenAddress?: string
  sourceTokenSymbol?: string
  swapAmountUsd?: number
  tokenAmount?: string
  underlyingTokenSymbol?: string
  vault: EarnVaultInfo
  withdrawMode?: string
}): {
  logFailed: (error: Error | undefined) => void
  logFinalized: (params: PlanFinalizedCallbackParams) => void
  logSubmitted: () => void
  reviewedEventProperties: EarnTransactionAnalyticsProperties
} {
  const analyticsProperties = useMemo<EarnTransactionAnalyticsProperties>(
    () => ({
      ...getEarnVaultAnalyticsProperties({
        entryPoint: analyticsEntryPoint,
        position,
        surface: analyticsSurface,
        underlyingTokenSymbol,
        vault,
      }),
      action,
      amount_usd: amountUsd,
      token_amount: tokenAmount,
      source_chain_id: sourceChainId,
      destination_chain_id: destinationChainId,
      source_token_address: sourceCurrency ? getCurrencyAddressForAnalytics(sourceCurrency) : sourceTokenAddress,
      source_token_symbol: sourceCurrency?.symbol ?? sourceTokenSymbol,
      destination_token_address: destinationCurrency
        ? getCurrencyAddressForAnalytics(destinationCurrency)
        : destinationTokenAddress,
      destination_token_symbol: destinationCurrency?.symbol ?? destinationTokenSymbol,
      estimated_network_fee_usd: getQuoteGasFeeUsd(quote),
      request_id: quote?.requestId,
      quote_id: quote?.quote.quoteId,
      withdraw_mode: withdrawMode,
    }),
    [
      action,
      amountUsd,
      analyticsEntryPoint,
      analyticsSurface,
      destinationChainId,
      destinationCurrency,
      destinationTokenAddress,
      destinationTokenSymbol,
      position,
      quote,
      sourceChainId,
      sourceCurrency,
      sourceTokenAddress,
      sourceTokenSymbol,
      tokenAmount,
      underlyingTokenSymbol,
      vault,
      withdrawMode,
    ],
  )
  const finalizedPlanIdsRef = useRef<Set<string>>(new Set())
  const failedPlanIdsRef = useRef<Set<string>>(new Set())
  const submittedExecutionRef = useRef(false)
  const pendingSubmittedFailureRef = useRef<Pick<
    EarnTransactionAnalyticsProperties,
    'error_message' | 'error_name'
  > | null>(null)

  const logSubmitted = useCallback(() => {
    submittedExecutionRef.current = true
    pendingSubmittedFailureRef.current = null
    logEarnTransactionEvent({ action, status: 'submitted', properties: analyticsProperties })

    if (action !== 'deposit') {
      return
    }

    const swapUpsellSurface = getSwapUpsellSurfaceForEntryPoint(analyticsEntryPoint)
    if (!swapUpsellSurface) {
      return
    }

    logEarnSwapUpsellConverted({
      ...analyticsProperties,
      output_currency_id: sourceUpsellCurrencyId,
      projected_monthly_earnings_usd:
        projectedMonthlyEarningsUsd ??
        getProjectedMonthlyEarningsUsd({
          amountUsd: swapAmountUsd ?? amountUsd,
          apyPercent: vault.apyPercent,
        }),
      source_upsell_currency_id: sourceUpsellCurrencyId,
      swap_amount_usd: swapAmountUsd ?? amountUsd,
      swap_upsell_surface: swapUpsellSurface,
      transaction_id: originatingTransactionId,
    })
  }, [
    action,
    amountUsd,
    analyticsEntryPoint,
    analyticsProperties,
    originatingTransactionId,
    projectedMonthlyEarningsUsd,
    sourceUpsellCurrencyId,
    swapAmountUsd,
    vault.apyPercent,
  ])

  const logFailed = useCallback(
    (error: Error | undefined) => {
      const errorProperties = getErrorAnalyticsProperties(error)
      if (submittedExecutionRef.current) {
        pendingSubmittedFailureRef.current = errorProperties
        return
      }

      logEarnTransactionEvent({
        action,
        status: 'failed',
        properties: {
          ...analyticsProperties,
          ...errorProperties,
        },
      })
    },
    [action, analyticsProperties],
  )

  const logFinalized = useCallback(
    (params: PlanFinalizedCallbackParams) => {
      const { planId, status } = params
      if (finalizedPlanIdsRef.current.has(planId)) {
        return
      }

      const finalizedProperties = { ...analyticsProperties, plan_id: planId }
      if (status === TransactionStatus.Success) {
        finalizedPlanIdsRef.current.add(planId)
        submittedExecutionRef.current = false
        pendingSubmittedFailureRef.current = null
        logEarnTransactionEvent({ action, status: 'completed', properties: finalizedProperties })
        return
      }

      if (!isFinalizedFailureStatus(status) || failedPlanIdsRef.current.has(planId)) {
        return
      }

      finalizedPlanIdsRef.current.add(planId)
      failedPlanIdsRef.current.add(planId)
      submittedExecutionRef.current = false
      logEarnTransactionEvent({
        action,
        status: 'failed',
        properties: {
          ...finalizedProperties,
          ...pendingSubmittedFailureRef.current,
        },
      })
      pendingSubmittedFailureRef.current = null
    },
    [action, analyticsProperties],
  )

  return {
    logFailed,
    logFinalized,
    logSubmitted,
    reviewedEventProperties: analyticsProperties,
  }
}
