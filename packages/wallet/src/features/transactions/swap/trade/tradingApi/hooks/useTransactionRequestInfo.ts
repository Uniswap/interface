import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers'
import { useEffect, useMemo, useRef } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useRestQuery } from 'uniswap/src/data/rest'
import { logger } from 'utilities/src/logger/logger'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  CreateSwapRequest,
  CreateSwapResponse,
  TransactionFailureReason,
} from 'wallet/src/data/tradingApi/__generated__/index'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'wallet/src/features/transactions/swap/analytics'
import { useWrapTransactionRequest } from 'wallet/src/features/transactions/swap/trade/legacy/hooks'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/trade/tradingApi/client'
import {
  getClassicQuoteFromResponse,
  isClassicQuote,
} from 'wallet/src/features/transactions/swap/trade/tradingApi/utils'
import {
  ApprovalAction,
  TokenApprovalInfo,
} from 'wallet/src/features/transactions/swap/trade/types'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { usePermit2SignatureWithData } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WrapType } from 'wallet/src/features/transactions/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'

export const UNKNOWN_SIM_ERROR = 'Unknown gas simulation error'

interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  gasFeeResult: GasFeeResult
}

export function useTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
  skip,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
  skip: boolean
}): TransactionRequestInfo {
  const formatter = useLocalizationContext()

  const { trade: tradeWithStatus, currencyAmounts } = derivedSwapInfo
  const { trade } = tradeWithStatus || { trade: undefined }

  const quote =
    trade?.quoteData?.quoteType === QuoteType.TradingApi ? trade.quoteData.quote : undefined

  // Quote indicates we need to include a signed permit message
  const requiresPermit2Sig = quote && !!quote.permitData

  const signatureInfo = usePermit2SignatureWithData(
    currencyAmounts[CurrencyField.INPUT],
    quote?.permitData,
    /**skip=*/ !requiresPermit2Sig || skip
  )

  /**
   * Simulate transactions to ensure they will not fail on-chain. Do not simulate for txs that need an approval as those require Tenderly to simulate and it is not currently integrated into the gas servic
   */
  const shouldSimulateTxn = tokenApprovalInfo?.action === ApprovalAction.None

  // Format request args
  const swapRequestArgs: CreateSwapRequest | undefined = useMemo(() => {
    if (!quote) {
      return undefined
    }
    if (requiresPermit2Sig && !signatureInfo.signature) {
      return undefined
    }
    // TODO: MOB(2438) https://linear.app/uniswap/issue/MOB-2438/uniswap-x-clean-old-trading-api-code
    if (!isClassicQuote(quote.quote)) {
      return undefined
    }
    // We cant get correct calldata from /swap if we dont have a valid slippage tolerance
    if (tradeWithStatus.trade?.slippageTolerance === undefined) {
      return undefined
    }

    // TODO: remove this when api does slippage calculation for us
    // https://linear.app/uniswap/issue/MOB-2581/remove-slippage-adjustment-in-swap-request
    quote.quote.slippage = tradeWithStatus.trade.slippageTolerance

    return {
      quote: quote.quote,
      permitData: quote.permitData ?? undefined,
      signature: signatureInfo.signature,
      simulateTransaction: shouldSimulateTxn,
      refreshGasPrice: true,
    }
  }, [
    quote,
    requiresPermit2Sig,
    shouldSimulateTxn,
    signatureInfo.signature,
    tradeWithStatus.trade?.slippageTolerance,
  ])

  // Wrap transaction request
  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)
  const wrapGasFee = useTransactionGasFee(wrapTxRequest, GasSpeed.Urgent, !isWrapApplicable)

  const skipTransactionRequest = !swapRequestArgs || isWrapApplicable || skip

  const { data, error, loading } = useRestQuery<
    CreateSwapResponse,
    CreateSwapRequest | Record<string, never>
  >(
    uniswapUrls.tradingApiPaths.swap,
    swapRequestArgs ?? {},
    ['swap', 'gasFee', 'requestId', 'txFailureReasons'],
    {
      // Poll often to ensure swap quote is never expected to fail
      pollInterval: PollingInterval.UltraFast,
      ttlMs: PollingInterval.UltraFast,
      skip: skipTransactionRequest,
    },
    'POST',
    TradingApiApolloClient
  )

  // We use the gasFee estimate from quote, as its more accurate
  const swapQuote = getClassicQuoteFromResponse(trade?.quoteData)
  const swapGasFee = swapQuote?.gasFee

  // This is a case where simulation fails on backend, meaning txn is expected to fail
  const simulationError = swapQuote?.txFailureReasons?.includes(
    TransactionFailureReason.SIMULATION_ERROR
  )
  const gasEstimateError = useMemo(
    () => (simulationError ? new Error(UNKNOWN_SIM_ERROR) : error),
    [simulationError, error]
  )

  const gasFeeResult = {
    value: isWrapApplicable ? wrapGasFee.value : swapGasFee,
    loading: isWrapApplicable ? wrapGasFee.loading : loading,
    error: isWrapApplicable ? wrapGasFee.error : gasEstimateError,
  }

  // Only log analytics events once per quote
  const previousQuoteIdRef = useRef(quote?.quote.quoteId)

  useEffect(() => {
    if (!quote) {
      return
    }

    const currentQuoteId = quote.quote.quoteId
    const isNewQuote = previousQuoteIdRef.current !== currentQuoteId
    previousQuoteIdRef.current = currentQuoteId

    if (!isNewQuote) {
      return
    }

    if (gasEstimateError) {
      logger.error(gasEstimateError, {
        tags: { file: 'useTransactionRequestInfo', function: 'useTransactionRequestInfo' },
        extra: {
          swapRequestArgs,
        },
      })

      sendWalletAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
        error: gasEstimateError,
        txRequest: data?.swap,
      })
    }
  }, [data?.swap, derivedSwapInfo, formatter, gasEstimateError, quote, swapRequestArgs])

  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : data?.swap,
    gasFeeResult,
  }
}
