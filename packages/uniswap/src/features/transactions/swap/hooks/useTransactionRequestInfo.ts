import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers/lib/ethers'
import { useEffect, useMemo, useRef } from 'react'
import { WithV4Flag } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
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
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useDynamicConfigValue, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'uniswap/src/features/transactions/swap/analytics'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/hooks/usePermit2Signature'
import { useWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/hooks/useWrapTransactionRequest'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapGasFeeEstimation } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  SWAP_GAS_URGENCY_OVERRIDE,
  getBridgeQuoteFromResponse,
  getClassicQuoteFromResponse,
  isClassicQuote,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isInterface, isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const UNKNOWN_SIM_ERROR = 'Unknown gas simulation error'

// TODO(UniswapX): add fallback gas limits per chain? l2s have higher costs
export const WRAP_FALLBACK_GAS_LIMIT_IN_GWEI = 45_000

const FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS = 1000
export interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  permitSignature: string | undefined
  permitData?: NullablePermit
  permitDataLoading?: boolean
  gasFeeResult: GasFeeResult
  gasEstimate: SwapGasFeeEstimation
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
  const v4Enabled = useFeatureFlag(FeatureFlags.V4Swap)

  const { trade: tradeWithStatus, customDeadline } = derivedSwapInfo
  const { trade } = tradeWithStatus || { trade: undefined }

  const isBridgeTrade = trade?.routing === Routing.BRIDGE
  const permitData = trade?.quote?.permitData
  // checks within functions for type of trade
  const swapQuote = getClassicQuoteFromResponse(trade?.quote) ?? getBridgeQuoteFromResponse(trade?.quote)

  // Quote indicates we need to include a signed permit message
  const requiresPermit2Sig = !!permitData

  // On interface, we do not fetch signature until after swap is clicked, as it requires user interaction.
  const signatureInfo = usePermit2SignatureWithData({ permitData, skip: skip || isInterface })

  /**
   * Simulate transactions to ensure they will not fail on-chain.
   * Do not simulate for bridge transactions or txs that need an approval
   * as those require Tenderly to simulate and it is not currently integrated into the gas servic
   */
  const shouldSimulateTxn = isBridgeTrade ? false : tokenApprovalInfo?.action === ApprovalAction.None
  const missingSig = requiresPermit2Sig && !signatureInfo.signature

  // Format request args
  const swapRequestArgs: WithV4Flag<CreateSwapRequest> | undefined = useMemo(() => {
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

    const swapArgs: WithV4Flag<CreateSwapRequest> = {
      quote,
      permitData: permitData ?? undefined,
      signature: signatureInfo.signature,
      simulateTransaction: shouldSimulateTxn,
      deadline,
      refreshGasPrice: true,
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
      v4Enabled,
    }

    return swapArgs
  }, [
    activeGasStrategy,
    customDeadline,
    isBridgeTrade,
    permitData,
    shadowGasStrategies,
    shouldSimulateTxn,
    signatureInfo.signature,
    swapQuote,
    tradeWithStatus,
    v4Enabled,
  ])

  // Wrap transaction request
  const isUniswapXWrap = trade && isUniswapX(trade) && trade.needsWrap
  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable || isUniswapXWrap
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo, account)
  const currentWrapGasFee = useTransactionGasFee(
    wrapTxRequest,
    !isWrapApplicable,
    undefined,
    WRAP_FALLBACK_GAS_LIMIT_IN_GWEI * 10e9,
  ) // Skip Gas Fee API call on transactions that don't need wrapping

  const wrapGasFeeRef = useRef(currentWrapGasFee)
  if (currentWrapGasFee.value) {
    wrapGasFeeRef.current = currentWrapGasFee
  }

  // Wrap gas cost should not change significantly between trades, so we can use the last value if current is unavailable.
  const wrapGasFee: GasFeeResult = useMemo(
    () => ({ ...currentWrapGasFee, value: currentWrapGasFee.value ?? wrapGasFeeRef.current.value }),
    [currentWrapGasFee],
  )

  const wrapTxRequestWithGasFee = useMemo(
    () => ({ ...wrapTxRequest, ...(wrapGasFee.params ?? {}) }),
    [wrapTxRequest, wrapGasFee],
  )

  const skipTransactionRequest = !swapRequestArgs || isWrapApplicable || skip || missingSig

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

  const gasEstimate: SwapGasFeeEstimation = useMemo(() => {
    const activeGasEstimate = data?.gasEstimates?.find((e) => areEqualGasStrategies(e.strategy, activeGasStrategy))
    const swapGasEstimate: GasFeeEstimates | undefined = activeGasEstimate
      ? {
          activeEstimate: activeGasEstimate,
          shadowEstimates: data?.gasEstimates?.filter((e) => e !== activeGasEstimate),
        }
      : undefined
    return {
      swapEstimates: swapGasEstimate,
      wrapEstimates: wrapGasFee.gasEstimates,
    }
  }, [data?.gasEstimates, activeGasStrategy, wrapGasFee.gasEstimates])

  return {
    gasFeeResult,
    transactionRequest: isWrapApplicable ? wrapTxRequestWithGasFee : data?.swap,
    permitSignature: signatureInfo.signature,
    permitDataLoading: signatureInfo.isLoading,
    permitData,
    gasEstimate,
    swapRequestArgs,
  }
}
