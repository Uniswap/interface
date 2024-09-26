import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers/lib/ethers'
import { useEffect, useMemo, useRef } from 'react'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import {
  CreateSwapRequest,
  NullablePermit,
  Routing,
  TransactionFailureReason,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { useActiveGasStrategy, useShadowGasStrategies, useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult, areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'uniswap/src/features/transactions/swap/analytics'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/hooks/usePermit2Signature'
import { useWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/hooks/useWrapTransactionRequest'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  getBridgeQuoteFromResponse,
  getClassicQuoteFromResponse,
  isClassicQuote,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const UNKNOWN_SIM_ERROR = 'Unknown gas simulation error'

const FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS = 1000
export interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  permitSignature: string | undefined
  permitData?: NullablePermit
  permitDataLoading?: boolean
  gasFeeResult: GasFeeResult
  gasEstimates?: GasFeeEstimates
  swapRequestArgs: CreateSwapRequest | undefined
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
  const activeGasStrategy = useActiveGasStrategy(derivedSwapInfo.chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(derivedSwapInfo.chainId, 'general')

  const { trade: tradeWithStatus, customDeadline } = derivedSwapInfo
  const { trade } = tradeWithStatus || { trade: undefined }

  const isBridgeTrade = trade?.routing === Routing.BRIDGE
  const permitData = trade?.quote?.permitData
  // checks within functions for type of trade
  const swapQuote = getClassicQuoteFromResponse(trade?.quote) ?? getBridgeQuoteFromResponse(trade?.quote)

  // Quote indicates we need to include a signed permit message
  const requiresPermit2Sig = !!permitData

  const signatureInfo = usePermit2SignatureWithData({ permitData, skip })

  /**
   * Simulate transactions to ensure they will not fail on-chain.
   * Do not simulate for bridge transactions or txs that need an approval
   * as those require Tenderly to simulate and it is not currently integrated into the gas servic
   */
  const shouldSimulateTxn = isBridgeTrade ? false : tokenApprovalInfo?.action === ApprovalAction.None

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
    if (tradeWithStatus.trade?.slippageTolerance === undefined && !isBridgeTrade) {
      return undefined
    }
    // TODO: update this when api does slippage calculation for us
    // https://linear.app/uniswap/issue/MOB-2581/remove-slippage-adjustment-in-swap-request
    const quote = {
      ...swapQuote,
      slippage: tradeWithStatus.trade?.slippageTolerance,
    }

    // if custom deadline is set (in minutes), convert to unix timestamp format from now
    const deadlineSeconds = (customDeadline ?? 0) * 60
    const deadline = customDeadline ? Math.floor(Date.now() / 1000) + deadlineSeconds : undefined

    const swapArgs: CreateSwapRequest = {
      quote,
      permitData: permitData ?? undefined,
      signature: signatureInfo.signature,
      simulateTransaction: shouldSimulateTxn,
      deadline,
      refreshGasPrice: true,
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
    }

    return swapArgs
  }, [
    activeGasStrategy,
    customDeadline,
    isBridgeTrade,
    permitData,
    requiresPermit2Sig,
    shadowGasStrategies,
    shouldSimulateTxn,
    signatureInfo.signature,
    swapQuote,
    tradeWithStatus,
  ])

  // Wrap transaction request
  const isUniswapXWrap = trade && isUniswapX(trade) && trade.needsWrap
  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable || isUniswapXWrap
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo, account)
  const currentWrapGasFee = useTransactionGasFee(wrapTxRequest, !isWrapApplicable)
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

  // This is a case where simulation fails on backend, meaning txn is expected to fail
  const simulationError =
    isClassicQuote(swapQuote) && swapQuote?.txFailureReasons?.includes(TransactionFailureReason.SIMULATION_ERROR)
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

  const gasEstimates = useMemo(() => {
    const activeGasEstimate = data?.gasEstimates?.find((e) => areEqualGasStrategies(e.strategy, activeGasStrategy))
    return activeGasEstimate
      ? {
          activeEstimate: activeGasEstimate,
          shadowEstimates: data?.gasEstimates?.filter((e) => e !== activeGasEstimate),
        }
      : undefined
  }, [data?.gasEstimates, activeGasStrategy])

  return {
    gasFeeResult,
    transactionRequest: isWrapApplicable ? wrapTxRequest : data?.swap,
    permitSignature: signatureInfo.signature,
    permitDataLoading: signatureInfo.isLoading,
    permitData,
    gasEstimates,
    swapRequestArgs,
  }
}
