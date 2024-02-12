import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers'
import { useEffect, useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'
import { CreateSwapRequest, CreateSwapResponse } from 'wallet/src/data/tradingApi/__generated__/api'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'wallet/src/features/transactions/swap/analytics'
import { useWrapTransactionRequest } from 'wallet/src/features/transactions/swap/hooks'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/tradingApi/client'
import { isClassicQuote } from 'wallet/src/features/transactions/swap/tradingApi/utils'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { usePermit2SignatureWithData } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WrapType } from 'wallet/src/features/transactions/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'

interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  gasFeeResult: GasFeeResult
}

const SIMULATION_ERROR_STRING = 'SIMULATION_ERROR'

export function useTransactionRequestInfo({
  derivedSwapInfo,
  skip,
}: {
  derivedSwapInfo: DerivedSwapInfo
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
      includeGasInfo: true,
    }
  }, [quote, requiresPermit2Sig, signatureInfo.signature, tradeWithStatus.trade?.slippageTolerance])

  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)

  const skipTransactionRequest = !swapRequestArgs || isWrapApplicable || skip

  const { data, error, loading } = useRestQuery<
    CreateSwapResponse,
    CreateSwapRequest | Record<string, never>
  >(
    uniswapUrls.tradingApiPaths.swap,
    swapRequestArgs ?? {},
    ['swap', 'gasFee', 'requestId', 'txFailureReasons'],
    {
      ttlMs: ONE_MINUTE_MS,
      skip: skipTransactionRequest,
    },
    'POST',
    TradingApiApolloClient
  )

  // TODO: pull type from the api spec once its updated
  // This is a case where simulation fails on backend, meaning txn is expected to fail
  const simulationError = data?.txFailureReasons?.includes(SIMULATION_ERROR_STRING)

  const gasEstimateError = simulationError || error

  const wrapGasFee = useTransactionGasFee(wrapTxRequest, GasSpeed.Urgent, !isWrapApplicable)
  const gasFeeValue = isWrapApplicable ? wrapGasFee.value : data?.gasFee
  const gasFeeResult = {
    value: gasFeeValue,
    loading: (isWrapApplicable && wrapGasFee.loading) || loading,
    error: gasEstimateError,
  }

  useEffect(() => {
    if (gasEstimateError) {
      // Copy this exact error string that we use in other places in the app, so they can group.
      const errorToLog = simulationError ? new Error('Unknown gas simulation error') : error

      logger.error(errorToLog, {
        tags: { file: 'useTransactionRequestInfo', function: 'useTransactionRequestInfo' },
        extra: {
          swapRequestArgs,
        },
      })

      sendWalletAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
        error: errorToLog,
        txRequest: data?.swap,
      })
    }
  }, [
    error,
    simulationError,
    gasEstimateError,
    swapRequestArgs,
    data?.swap,
    formatter,
    derivedSwapInfo,
  ])

  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : data?.swap,
    gasFeeResult,
  }
}
