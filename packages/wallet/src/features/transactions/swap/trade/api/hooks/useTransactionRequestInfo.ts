import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers'
import { useEffect, useMemo, useRef } from 'react'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { CreateSwapRequest, TransactionFailureReason } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'uniswap/src/features/gas/types'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { EstimatedGasFeeDetails } from 'uniswap/src/features/telemetry/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'wallet/src/features/transactions/swap/analytics'
import { useWrapTransactionRequest } from 'wallet/src/features/transactions/swap/trade/hooks/useWrapTransactionRequest'
import { usePermit2SignatureWithData } from 'wallet/src/features/transactions/swap/usePermit2Signature'

export const UNKNOWN_SIM_ERROR = 'Unknown gas simulation error'

const FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS = 1000
export interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  permitSignature: string | undefined
  gasFeeResult: GasFeeResult
  gasFeeEstimation: EstimatedGasFeeDetails
}

export function useTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
  account,
  skip,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
  account?: AccountMeta
  skip: boolean
}): TransactionRequestInfo {
  const formatter = useLocalizationContext()

  const { trade: tradeWithStatus } = derivedSwapInfo
  const { trade } = tradeWithStatus || { trade: undefined }

  const permitData = trade?.quote?.permitData
  const swapQuote = getClassicQuoteFromResponse(trade?.quote)

  // Quote indicates we need to include a signed permit message
  const requiresPermit2Sig = !!permitData

  const signatureInfo = usePermit2SignatureWithData({ permitData, skip })

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
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo, account)
  const currentWrapGasFee = useTransactionGasFee(wrapTxRequest, GasSpeed.Urgent, !isWrapApplicable)
  const wrapGasFeeRef = useRef(currentWrapGasFee)
  if (currentWrapGasFee.value) {
    wrapGasFeeRef.current = currentWrapGasFee
  }
  // Wrap gas cost should not change significantly between trades, so we can use the last value if current is unavailable.
  const wrapGasFee = useMemo(
    () => ({ ...currentWrapGasFee, value: currentWrapGasFee.value ?? wrapGasFeeRef.current.value }),
    [currentWrapGasFee],
  )

  const skipTransactionRequest = !swapRequestArgs || isWrapApplicable || skip

  const tradingApiSwapRequestMs = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.TradingApiSwapRequestMs,
    FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  )

  const {
    data,
    error,
    isLoading: isSwapLoading,
  } = useTradingApiSwapQuery({
    params: skipTransactionRequest ? undefined : swapRequestArgs,
    // Disable polling during e2e testing because it was preventing js thread from going idle
    refetchInterval: isDetoxBuild ? undefined : tradingApiSwapRequestMs,
    staleTime: tradingApiSwapRequestMs,
    // We add a small buffer in case connection is too slow
    immediateGcTime: tradingApiSwapRequestMs + ONE_SECOND_MS * 5,
  })

  // We use the gasFee estimate from quote, as its more accurate

  const swapGasFee = swapQuote?.gasFee

  const gasFeeEstimation: EstimatedGasFeeDetails = {
    gasUseEstimate: swapQuote?.gasUseEstimate,
    maxFeePerGas: swapQuote?.maxFeePerGas,
    maxPriorityFeePerGas: swapQuote?.maxPriorityFeePerGas,
    gasFee: swapQuote?.gasFee,
  }

  // This is a case where simulation fails on backend, meaning txn is expected to fail
  const simulationError = swapQuote?.txFailureReasons?.includes(TransactionFailureReason.SIMULATION_ERROR)
  const gasEstimateError = useMemo(
    () => (simulationError ? new Error(UNKNOWN_SIM_ERROR) : error),
    [simulationError, error],
  )

  const gasFeeResult = useMemo(
    () => ({
      value: isWrapApplicable ? wrapGasFee.value : swapGasFee,
      isLoading: isWrapApplicable ? wrapGasFee.isLoading : isSwapLoading,
      error: isWrapApplicable ? wrapGasFee.error : gasEstimateError,
    }),
    [isWrapApplicable, wrapGasFee, swapGasFee, isSwapLoading, gasEstimateError],
  )

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
      logger.warn('useTransactionRequestInfo', 'useTransactionRequestInfo', UNKNOWN_SIM_ERROR, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
        error: gasEstimateError,
        txRequest: data?.swap,
      })

      if (!isMobileApp) {
        sendAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
          ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
          error: gasEstimateError,
          txRequest: data?.swap,
        })
      }
    }
  }, [data?.swap, derivedSwapInfo, formatter, gasEstimateError, swapRequestArgs, trade])

  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : data?.swap,
    permitSignature: signatureInfo.signature,
    gasFeeResult,
    gasFeeEstimation,
  }
}
