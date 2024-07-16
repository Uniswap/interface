import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers'
import { useEffect, useMemo, useRef } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useRestQuery } from 'uniswap/src/data/rest'
import { DynamicConfigs, PollingIntervalsConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  CreateSwapRequest,
  CreateSwapResponse,
  TransactionFailureReason,
} from 'wallet/src/data/tradingApi/__generated__/index'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'wallet/src/features/transactions/swap/analytics'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/trade/api/client'
import { getClassicQuoteFromResponse } from 'wallet/src/features/transactions/swap/trade/api/utils'
import { useWrapTransactionRequest } from 'wallet/src/features/transactions/swap/trade/hooks/useWrapTransactionRequest'
import { ApprovalAction, TokenApprovalInfo } from 'wallet/src/features/transactions/swap/trade/types'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { usePermit2SignatureWithData } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { WrapType } from 'wallet/src/features/transactions/types'

export const UNKNOWN_SIM_ERROR = 'Unknown gas simulation error'

const FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS = 1000
export interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  permitSignature: string | undefined
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

  const permitData = trade?.quote?.permitData
  const swapQuote = getClassicQuoteFromResponse(trade?.quote)

  // Quote indicates we need to include a signed permit message
  const requiresPermit2Sig = !!permitData

  const signatureInfo = usePermit2SignatureWithData(
    currencyAmounts[CurrencyField.INPUT],
    permitData,
    /**skip=*/ !requiresPermit2Sig || skip,
  )

  /**
   * Simulate transactions to ensure they will not fail on-chain. Do not simulate for txs that need an approval as those require Tenderly to simulate and it is not currently integrated into the gas servic
   */
  const shouldSimulateTxn = tokenApprovalInfo?.action === ApprovalAction.None

  // Format request args
  const swapRequestArgs: CreateSwapRequest | undefined = useMemo(() => {
    if (requiresPermit2Sig && !signatureInfo.signature) {
      return undefined
    }
    // TODO: MOB(2438) https://linear.app/uniswap/issue/MOB-2438/uniswap-x-clean-old-trading-api-code
    if (!swapQuote) {
      return undefined
    }
    // We cant get correct calldata from /swap if we dont have a valid slippage tolerance
    if (tradeWithStatus.trade?.slippageTolerance === undefined) {
      return undefined
    }
    // TODO: remove this when api does slippage calculation for us
    // https://linear.app/uniswap/issue/MOB-2581/remove-slippage-adjustment-in-swap-request
    const quoteWithSlippage = {
      ...swapQuote,
      slippage: tradeWithStatus.trade.slippageTolerance,
    }

    const swapArgs: CreateSwapRequest = {
      quote: quoteWithSlippage,
      permitData: permitData ?? undefined,
      signature: signatureInfo.signature,
      simulateTransaction: shouldSimulateTxn,
      refreshGasPrice: true,
    }

    return swapArgs
  }, [
    permitData,
    requiresPermit2Sig,
    shouldSimulateTxn,
    signatureInfo.signature,
    swapQuote,
    tradeWithStatus.trade?.slippageTolerance,
  ])

  // Wrap transaction request
  const isUniswapXWrap = trade && isUniswapX(trade) && trade.needsWrap
  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable || isUniswapXWrap
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)
  const wrapGasFee = useTransactionGasFee(wrapTxRequest, GasSpeed.Urgent, !isWrapApplicable)

  const skipTransactionRequest = !swapRequestArgs || isWrapApplicable || skip

  // We will remove this cast in follow up change to dynamic config typing
  const tradingApiSwapRequestMs = useDynamicConfigValue(
    DynamicConfigs.PollingIntervals,
    PollingIntervalsConfigKey.TradingApiSwapRequestMs,
    FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  )

  const { data, error, loading } = useRestQuery<CreateSwapResponse, CreateSwapRequest | Record<string, never>>(
    uniswapUrls.tradingApiPaths.swap,
    swapRequestArgs ?? {},
    ['swap', 'gasFee', 'requestId', 'txFailureReasons'],
    {
      // disables react query polling during e2e testing which was preventing js thread from idle
      pollInterval: isDetoxBuild ? undefined : tradingApiSwapRequestMs,
      clearIfStale: true,
      ttlMs: tradingApiSwapRequestMs + ONE_SECOND_MS * 5, // Small buffer if connection is lost
      skip: skipTransactionRequest,
    },
    'POST',
    TradingApiApolloClient,
  )

  // We use the gasFee estimate from quote, as its more accurate

  const swapGasFee = swapQuote?.gasFee

  // This is a case where simulation fails on backend, meaning txn is expected to fail
  const simulationError = swapQuote?.txFailureReasons?.includes(TransactionFailureReason.SIMULATION_ERROR)
  const gasEstimateError = useMemo(
    () => (simulationError ? new Error(UNKNOWN_SIM_ERROR) : error),
    [simulationError, error],
  )

  const gasFeeResult = {
    value: isWrapApplicable ? wrapGasFee.value : swapGasFee,
    loading: isWrapApplicable ? wrapGasFee.loading : loading,
    error: isWrapApplicable ? wrapGasFee.error : gasEstimateError,
  }

  // Only log analytics events once per request
  const previousRequestIdRef = useRef(trade?.quote?.requestId)

  useEffect(() => {
    // Only log errors if we have a valid quote with requestId
    if (!trade?.quote || !trade.quote.requestId) {
      return
    }

    const currentRequestId = trade.quote.requestId
    const isNewQuote = previousRequestIdRef.current !== currentRequestId

    // reset request id
    previousRequestIdRef.current = currentRequestId

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

      sendAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
        error: gasEstimateError,
        txRequest: data?.swap,
      })
    }
  }, [data?.swap, derivedSwapInfo, formatter, gasEstimateError, swapRequestArgs, trade])

  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : data?.swap,
    permitSignature: signatureInfo.signature,
    gasFeeResult,
  }
}
