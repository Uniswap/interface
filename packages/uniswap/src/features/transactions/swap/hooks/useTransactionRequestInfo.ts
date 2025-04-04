import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers/lib/ethers'
import { useEffect, useMemo, useRef } from 'react'
import { WithV4Flag } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import {
  CreateSwapRequest,
  NullablePermit,
  Routing,
  TransactionFailureReason,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  convertGasFeeToDisplayValue,
  useActiveGasStrategy,
  useShadowGasStrategies,
  useTransactionGasFee,
} from 'uniswap/src/features/gas/hooks'
import { GasFeeResult, areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'uniswap/src/features/transactions/swap/analytics'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/hooks/usePermit2Signature'
import { useWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/hooks/useWrapTransactionRequest'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapGasFeeEstimation } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/useV4SwapEnabled'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  SWAP_GAS_URGENCY_OVERRIDE,
  getBridgeQuoteFromResponse,
  getClassicQuoteFromResponse,
  isClassicQuote,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { isE2EMode } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isInterface, isMobileApp } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
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
  simulationFailureReasons?: TransactionFailureReason[]
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
  const trace = useTrace()
  const activeGasStrategy = useActiveGasStrategy(derivedSwapInfo.chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(derivedSwapInfo.chainId, 'general')
  const v4SwapEnabled = useV4SwapEnabled(derivedSwapInfo.chainId)
  const transactionSettings = useTransactionSettingsContext()

  const { trade: tradeWithStatus } = derivedSwapInfo
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

    const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline)

    const swapArgs: WithV4Flag<CreateSwapRequest> = {
      quote: swapQuote,
      permitData: permitData ?? undefined,
      signature: signatureInfo.signature,
      simulateTransaction: shouldSimulateTxn,
      deadline,
      refreshGasPrice: true,
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
      v4Enabled: v4SwapEnabled,
    }

    return swapArgs
  }, [
    activeGasStrategy,
    transactionSettings.customDeadline,
    permitData,
    shadowGasStrategies,
    shouldSimulateTxn,
    signatureInfo.signature,
    swapQuote,
    v4SwapEnabled,
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
    () => ({
      ...currentWrapGasFee,
      value: currentWrapGasFee.value ?? wrapGasFeeRef.current.value,
      displayValue: currentWrapGasFee.displayValue ?? wrapGasFeeRef.current.displayValue,
    }),
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
    refetchInterval: isE2EMode ? undefined : tradingApiSwapRequestMs,
    staleTime: tradingApiSwapRequestMs,
    // We add a small buffer in case connection is too slow
    immediateGcTime: tradingApiSwapRequestMs + ONE_SECOND_MS * 5,
  })

  // We use the gasFee estimate from quote, as its more accurate
  const swapGasFee = useMemo(
    () => ({
      value: swapQuote?.gasFee,
      displayValue: convertGasFeeToDisplayValue(swapQuote?.gasFee, activeGasStrategy),
    }),
    [swapQuote?.gasFee, activeGasStrategy],
  )

  // This is a case where simulation fails on backend, meaning txn is expected to fail
  const simulationFailureReasons = isClassicQuote(swapQuote) ? swapQuote?.txFailureReasons : undefined
  const simulationError =
    simulationFailureReasons?.includes(TransactionFailureReason.SIMULATION_ERROR) ||
    simulationFailureReasons?.includes(TransactionFailureReason.SLIPPAGE_TOO_LOW)

  const gasEstimateError = useMemo(
    () => (simulationError ? new Error(UNKNOWN_SIM_ERROR) : error),
    [simulationError, error],
  )

  const gasFeeResult = useMemo(
    () => ({
      value: isWrapApplicable ? wrapGasFee.value : swapGasFee.value,
      displayValue: isWrapApplicable ? wrapGasFee.displayValue : swapGasFee.displayValue,
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
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, transactionSettings, formatter, trace }),
        // we explicitly log it here to show on Datadog dashboard
        chainLabel: getChainLabel(derivedSwapInfo.chainId),
        error: gasEstimateError,
        simulationFailureReasons: isClassicQuote(swapQuote) ? swapQuote?.txFailureReasons : undefined,
        txRequest: data?.swap,
      })

      if (!(isMobileApp || isExtension)) {
        sendAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
          ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, transactionSettings, formatter, trace }),
          error: gasEstimateError,
          txRequest: data?.swap,
          simulationFailureReasons: isClassicQuote(swapQuote) ? swapQuote?.txFailureReasons : undefined,
        })
      }
    }
  }, [
    data?.swap,
    transactionSettings,
    derivedSwapInfo,
    formatter,
    gasEstimateError,
    swapRequestArgs,
    trade,
    trace,
    swapQuote,
  ])

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
    simulationFailureReasons,
  }
}
