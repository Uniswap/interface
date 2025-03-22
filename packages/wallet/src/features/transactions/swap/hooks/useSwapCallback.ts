import { SwapEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapCallback, SwapCallbackParams } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { swapActions } from 'wallet/src/features/transactions/swap/swapSaga'
import { toStringish } from 'wallet/src/utils/number'

/** Callback to submit trades and track progress */
export function useSwapCallback(): SwapCallback {
  const appDispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const trace = useTrace()

  const accountMeta = useAccountMeta()

  const { data: portfolioData } = usePortfolioTotalValue({
    address: accountMeta?.address,
    fetchPolicy: 'cache-first',
  })

  return useCallback(
    (args: SwapCallbackParams) => {
      const {
        account,
        swapTxContext,
        txId,
        onSuccess,
        onFailure,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        isAutoSlippage,
        isFiatInputMode,
      } = args
      const { trade, gasFee } = swapTxContext

      // unsigned (missing permit signature) swaps are only supported on interface; this is an unreachable state and the following check is included for type safety.
      if (swapTxContext.routing === Routing.CLASSIC && swapTxContext.unsigned) {
        throw new Error('Swaps with async signatures are not implemented for wallet')
      }

      const analytics = getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        portfolioBalanceUsd: portfolioData?.balanceUSD,
        trace,
      })
      appDispatch(swapActions.trigger({ swapTxContext, txId, account, analytics, onSuccess, onFailure }))

      const blockNumber = getClassicQuoteFromResponse(trade?.quote)?.blockNumber?.toString()

      sendAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, {
        ...analytics,
        estimated_network_fee_wei: gasFee.value,
        gas_limit: isClassic(swapTxContext) ? toStringish(swapTxContext.txRequest.gasLimit) : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp ? Date.now() - swapStartTimestamp : undefined,
        is_fiat_input_mode: isFiatInputMode,
      })

      // Reset swap start timestamp now that the swap has been submitted
      appDispatch(updateSwapStartTimestamp({ timestamp: undefined }))
    },
    [appDispatch, formatter, portfolioData?.balanceUSD, swapStartTimestamp, trace],
  )
}
