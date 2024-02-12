import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { setHasSubmittedHoldToSwap } from 'wallet/src/features/behaviorHistory/slice'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { SwapParams, swapActions } from 'wallet/src/features/transactions/swap/swapSaga'
import { isClassicQuote } from 'wallet/src/features/transactions/swap/trade/tradingApi/utils'
import { Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { tradeToTransactionInfo } from 'wallet/src/features/transactions/swap/utils'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { selectSwapStartTimestamp } from 'wallet/src/telemetry/timing/selectors'
import { updateSwapStartTimestamp } from 'wallet/src/telemetry/timing/slice'
import { toStringish } from 'wallet/src/utils/number'

/** Callback to submit trades and track progress */
export function useSwapCallback(
  approveTxRequest: providers.TransactionRequest | undefined,
  swapTxRequest: providers.TransactionRequest | undefined,
  gasFee: GasFeeResult,
  trade: Trade | null | undefined,
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>,
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>,
  isAutoSlippage: boolean,
  onSubmit: () => void,
  txId?: string,
  isHoldToSwap?: boolean,

  isFiatInputMode?: boolean
): () => void {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useAppSelector(selectSwapStartTimestamp)

  return useMemo(() => {
    if (!account || !swapTxRequest || !trade || !gasFee.value) {
      return () => {
        logger.error(new Error('Attempted swap with missing required parameters'), {
          tags: {
            file: 'swap/hooks',
            function: 'useSwapCallback',
          },
          extra: { account, swapTxRequest, trade, gasFee },
        })
      }
    }

    return () => {
      const params: SwapParams = {
        txId,
        account,
        analytics: getBaseTradeAnalyticsProperties({ formatter, trade }),
        approveTxRequest,
        swapTxRequest,
        swapTypeInfo: tradeToTransactionInfo(trade),
      }

      appDispatch(swapActions.trigger(params))
      onSubmit()

      const blockNumber =
        trade.quoteData?.quoteType === QuoteType.TradingApi
          ? isClassicQuote(trade.quoteData?.quote?.quote)
            ? trade.quoteData?.quote?.quote?.blockNumber?.toString()
            : undefined
          : trade.quoteData?.quote?.blockNumber

      sendWalletAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, {
        ...getBaseTradeAnalyticsProperties({ formatter, trade }),
        estimated_network_fee_wei: gasFee.value,
        gas_limit: toStringish(swapTxRequest.gasLimit),
        token_in_amount_usd: currencyInAmountUSD
          ? parseFloat(currencyInAmountUSD.toFixed(2))
          : undefined,
        token_out_amount_usd: currencyOutAmountUSD
          ? parseFloat(currencyOutAmountUSD.toFixed(2))
          : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp
          ? Date.now() - swapStartTimestamp
          : undefined,
        is_hold_to_swap: isHoldToSwap,
        is_fiat_input_mode: isFiatInputMode,
      })

      // Reset swap start timestamp now that the swap has been submitted
      appDispatch(updateSwapStartTimestamp({ timestamp: undefined }))

      // Mark hold to swap persisted user behavior
      if (isHoldToSwap) {
        appDispatch(setHasSubmittedHoldToSwap(true))
      }
    }
  }, [
    account,
    swapTxRequest,
    trade,
    gasFee,
    appDispatch,
    txId,
    currencyInAmountUSD,
    currencyOutAmountUSD,
    approveTxRequest,
    onSubmit,
    formatter,
    isAutoSlippage,
    swapStartTimestamp,
    isHoldToSwap,
    isFiatInputMode,
  ])
}
