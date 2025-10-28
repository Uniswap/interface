import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import {
  ExecuteSwapCallback,
  ExecuteSwapParams,
  SwapHandlers,
} from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { getEVMTxRequest, isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { toStringish } from 'uniswap/src/utils/number'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { executeSwapActions } from 'wallet/src/features/transactions/swap/configuredSagas'
import { useSwapSigning } from 'wallet/src/features/transactions/swap/hooks/useSwapSigning'

/**
 * Custom hook that provides SwapHandlers with improved caching for prepared transactions
 */
export function useSwapHandlers(): SwapHandlers | undefined {
  const dispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const trace = useTrace()

  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: useWallet().evmAccount?.address,
    fetchPolicy: 'cache-first',
  })

  const signing = useSwapSigning()

  const execute: ExecuteSwapCallback = useCallback(
    async (params: ExecuteSwapParams) => {
      // Mark execution as called to prevent future prepareAndSign calls
      signing.markExecutionCalled()

      const {
        account: executeAccount,
        swapTxContext,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        isAutoSlippage,
        presetPercentage,
        preselectAsset,
        onSuccess,
        onFailure,
        onPending,
        txId,
        isFiatInputMode,
      } = params

      const { trade, gasFee } = swapTxContext
      const txRequest = getEVMTxRequest(swapTxContext)
      const isSmartWalletTransaction = txRequest?.to === executeAccount.address

      const analytics = getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        presetPercentage,
        preselectAsset,
        portfolioBalanceUsd: portfolioData?.balanceUSD,
        trace,
        includesDelegation: swapTxContext.includesDelegation,
        isSmartWalletTransaction,
      })

      // Get the best available signed transaction
      const preSignedTransaction = await signing.getValidSignedTransaction(swapTxContext)

      // Clear signing state after getting the transaction
      signing.clearSigningState()

      const accountMeta: AccountMeta = { ...executeAccount, type: executeAccount.accountType }

      // Dispatch the execute swap saga
      dispatch(
        executeSwapActions.trigger({
          swapTxContext,
          txId,
          account: accountMeta,
          analytics,
          onSuccess,
          onFailure,
          onPending,
          preSignedTransaction,
        }),
      )

      // Send analytics event similar to useSwapCallback
      const blockNumber = getClassicQuoteFromResponse(trade.quote)?.blockNumber?.toString()

      sendAnalyticsEvent(SwapEventName.SwapSubmittedButtonClicked, {
        ...analytics,
        estimated_network_fee_wei: gasFee.value,
        gas_limit: isClassic(swapTxContext) ? toStringish(swapTxContext.txRequests?.[0].gasLimit) : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp ? Date.now() - swapStartTimestamp : undefined,
        is_fiat_input_mode: isFiatInputMode,
      })

      // Reset swap start timestamp
      dispatch(updateSwapStartTimestamp({ timestamp: undefined }))
    },
    [dispatch, formatter, portfolioData?.balanceUSD, swapStartTimestamp, trace, signing],
  )

  return useMemo(
    () =>
      getFeatureFlag(FeatureFlags.SwapPreSign)
        ? {
            prepareAndSign: signing.prepareAndSign,
            execute,
          }
        : undefined,
    [execute, signing.prepareAndSign],
  )
}
