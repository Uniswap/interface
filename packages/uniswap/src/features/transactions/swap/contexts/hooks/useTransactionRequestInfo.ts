/* eslint-disable max-lines */
import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers/lib/ethers'
import { useEffect, useMemo, useRef } from 'react'
import {
  BridgeQuoteResponse,
  ClassicQuoteResponse,
  WithV4Flag,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import {
  BridgeQuote,
  ClassicQuote,
  CreateSwapRequest,
  CreateSwapResponse,
  NullablePermit,
  QuoteResponse,
  Routing,
  TransactionFailureReason,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
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
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  TransactionSettingsContextState,
  useTransactionSettingsContext,
} from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'uniswap/src/features/transactions/swap/analytics'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/contexts/hooks/usePermit2Signature'
import { useWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/contexts/hooks/useWrapTransactionRequest'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapGasFeeEstimation } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/useV4SwapEnabled'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { SWAP_GAS_URGENCY_OVERRIDE, isClassicQuote } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isE2EMode } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isInterface, isMobileApp } from 'utilities/src/platform'
import { ITraceContext, useTrace } from 'utilities/src/telemetry/trace/TraceContext'
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

function processWrapResponse({
  gasFeeResult,
  wrapTxRequest,
}: {
  gasFeeResult: GasFeeResult
  wrapTxRequest: providers.TransactionRequest | undefined
}): TransactionRequestInfo {
  const wrapTxRequestWithGasFee = { ...wrapTxRequest, ...(gasFeeResult.params ?? {}) }

  const gasEstimate: SwapGasFeeEstimation = {
    wrapEstimates: gasFeeResult.gasEstimates,
  }

  return {
    gasFeeResult,
    transactionRequest: wrapTxRequestWithGasFee,
    permitSignature: undefined,
    gasEstimate,
    swapRequestArgs: undefined,
  }
}

export function useWrapTransactionRequestInfo({
  derivedSwapInfo,
  account,
}: {
  derivedSwapInfo: DerivedSwapInfo
  account?: AccountMeta
}): TransactionRequestInfo {
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo, account)
  const gasFeeResult = useTransactionGasFee(
    wrapTxRequest,
    !getIsWrapApplicable({ derivedSwapInfo }),
    undefined,
    WRAP_FALLBACK_GAS_LIMIT_IN_GWEI * 10e9,
  ) // Skip Gas Fee API call on transactions that don't need wrapping

  const result = useMemo(() => processWrapResponse({ gasFeeResult, wrapTxRequest }), [gasFeeResult, wrapTxRequest])

  const cachedGasFeeResultRef = useRef(gasFeeResult)
  if (gasFeeResult.value) {
    cachedGasFeeResultRef.current = gasFeeResult
  }

  // Wrap gas cost should not change significantly between trades, so we can use the last value if current is unavailable.
  const resultWithCaching = useMemo(() => {
    const value = result.gasFeeResult.value ?? cachedGasFeeResultRef.current.value
    const displayValue = result.gasFeeResult.displayValue ?? cachedGasFeeResultRef.current.displayValue

    const gasFeeResultWithCaching = {
      ...result.gasFeeResult,
      value,
      displayValue,
    }

    return { ...result, gasFeeResult: gasFeeResultWithCaching }
  }, [result])

  return resultWithCaching
}

function createPrepareSwapRequestParams({
  activeGasStrategy,
  shadowGasStrategies,
  v4SwapEnabled,
}: {
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  v4SwapEnabled: boolean
}) {
  return function prepareSwapRequestParams({
    swapQuoteResponse,
    signature,
    transactionSettings,
    alreadyApproved,
  }: {
    swapQuoteResponse: ClassicQuoteResponse | BridgeQuoteResponse
    signature: string | undefined
    transactionSettings: TransactionSettingsContextState
    alreadyApproved: boolean
  }): WithV4Flag<CreateSwapRequest> {
    const isBridgeTrade = swapQuoteResponse?.routing === Routing.BRIDGE
    const permitData = swapQuoteResponse?.permitData

    /**
     * Simulate transactions to ensure they will not fail on-chain.
     * Do not simulate for bridge transactions or txs that need an approval
     * as those require Tenderly to simulate and it is not currently integrated into the gas servic
     */
    const shouldSimulateTxn = isBridgeTrade ? false : alreadyApproved

    const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline)

    return {
      quote: swapQuoteResponse.quote,
      permitData: permitData ?? undefined,
      signature,
      simulateTransaction: shouldSimulateTxn,
      deadline,
      refreshGasPrice: true,
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
      v4Enabled: v4SwapEnabled,
    }
  }
}

/** Returns an error if simulation fails on backend and we expect the swap transaction to fail */
function getSimulationError({
  swapQuote,
  isRevokeNeeded,
}: {
  swapQuote: ClassicQuote | BridgeQuote | undefined
  isRevokeNeeded: boolean
}): Error | null {
  if (!isClassicQuote(swapQuote)) {
    return null
  }

  const validSimulationErrors = swapQuote?.txFailureReasons?.filter((reason) => {
    const isExpectedErrorFromRevoke = isRevokeNeeded && reason === TransactionFailureReason.SIMULATION_ERROR
    return !isExpectedErrorFromRevoke
  })

  if (
    validSimulationErrors?.includes(TransactionFailureReason.SIMULATION_ERROR) ||
    validSimulationErrors?.includes(TransactionFailureReason.SLIPPAGE_TOO_LOW)
  ) {
    return new Error(UNKNOWN_SIM_ERROR)
  }

  return null
}

function createProcessSwapResponse({ activeGasStrategy }: { activeGasStrategy: GasStrategy }) {
  return function processSwapResponse({
    response,
    error,
    swapQuote,
    isSwapLoading,
    signature,
    permitData,
    permitDataLoading,
    swapRequestParams,
    isRevokeNeeded,
  }: {
    response: CreateSwapResponse | undefined
    error: Error | null
    swapQuote: ClassicQuote | BridgeQuote | undefined
    isSwapLoading: boolean
    signature: string | undefined
    permitData: NullablePermit | undefined
    permitDataLoading: boolean
    swapRequestParams: WithV4Flag<CreateSwapRequest> | undefined
    isRevokeNeeded: boolean
  }): TransactionRequestInfo {
    // We use the gasFee estimate from quote, as its more accurate
    const swapGasFee = {
      value: swapQuote?.gasFee,
      displayValue: convertGasFeeToDisplayValue(swapQuote?.gasFee, activeGasStrategy),
    }

    // This is a case where simulation fails on backend, meaning txn is expected to fail
    const simulationError = getSimulationError({ swapQuote, isRevokeNeeded })

    const gasEstimateError = simulationError ? new Error(UNKNOWN_SIM_ERROR) : error

    const gasFeeResult = {
      value: swapGasFee.value,
      displayValue: swapGasFee.displayValue,
      isLoading: isSwapLoading,
      error: gasEstimateError,
    }

    const activeGasEstimate = response?.gasEstimates?.find((e) => areEqualGasStrategies(e.strategy, activeGasStrategy))
    const swapGasEstimate: GasFeeEstimates | undefined = activeGasEstimate
      ? {
          activeEstimate: activeGasEstimate,
          shadowEstimates: response?.gasEstimates?.filter((e) => e !== activeGasEstimate),
        }
      : undefined
    const gasEstimate = {
      swapEstimates: swapGasEstimate,
    }

    return {
      gasFeeResult,
      transactionRequest: response?.swap,
      permitSignature: signature,
      permitData,
      permitDataLoading,
      gasEstimate,
      swapRequestArgs: swapRequestParams,
    }
  }
}

function getIsWrapApplicable({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): boolean {
  const { trade } = derivedSwapInfo.trade

  const isUniswapXWrap = trade && isUniswapX(trade) && trade.needsWrap
  return Boolean(derivedSwapInfo.wrapType !== WrapType.NotApplicable || isUniswapXWrap)
}

function getShouldSkipSwapRequest({
  derivedSwapInfo,
  tokenApprovalInfo,
  signature,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
  signature: string | undefined
}): boolean {
  const { trade } = derivedSwapInfo.trade
  const { currencyBalances, currencyAmounts } = derivedSwapInfo
  const currencyAmount = currencyAmounts[CurrencyField.INPUT]
  const currencyBalance = currencyBalances[CurrencyField.INPUT]

  const requiresPermit2Sig = !!trade?.quote?.permitData
  const missingSig = requiresPermit2Sig && !signature
  const exceedsMaxAmount = Boolean(currencyBalance && currencyAmount && currencyBalance.lessThan(currencyAmount))
  const approvalInfoMissing = !tokenApprovalInfo?.action || tokenApprovalInfo?.action === ApprovalAction.Unknown

  return getIsWrapApplicable({ derivedSwapInfo }) || exceedsMaxAmount || approvalInfoMissing || missingSig
}

export function useSwapTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
}): TransactionRequestInfo {
  const formatter = useLocalizationContext()
  const trace = useTrace()
  const activeGasStrategy = useActiveGasStrategy(derivedSwapInfo.chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(derivedSwapInfo.chainId, 'general')
  const v4SwapEnabled = useV4SwapEnabled(derivedSwapInfo.chainId)
  const transactionSettings = useTransactionSettingsContext()

  const permitData = derivedSwapInfo.trade.trade?.quote?.permitData
  // On interface, we do not fetch signature until after swap is clicked, as it requires user interaction.
  const signatureInfo = usePermit2SignatureWithData({ permitData, skip: isInterface })

  const swapQuoteResponse = getBridgeOrClassicQuoteResponse({ quote: derivedSwapInfo.trade.trade?.quote })
  const swapQuote = swapQuoteResponse?.quote

  const prepareSwapRequestParams = useMemo(
    () => createPrepareSwapRequestParams({ activeGasStrategy, shadowGasStrategies, v4SwapEnabled }),
    [activeGasStrategy, shadowGasStrategies, v4SwapEnabled],
  )

  const swapRequestParams = useMemo(() => {
    if (!swapQuoteResponse) {
      return undefined
    }

    return prepareSwapRequestParams({
      swapQuoteResponse,
      signature: signatureInfo.signature,
      transactionSettings,
      alreadyApproved: tokenApprovalInfo?.action === ApprovalAction.None,
    })
  }, [
    prepareSwapRequestParams,
    swapQuoteResponse,
    signatureInfo.signature,
    transactionSettings,
    tokenApprovalInfo?.action,
  ])

  const shouldSkipSwapRequest = getShouldSkipSwapRequest({
    derivedSwapInfo,
    tokenApprovalInfo,
    signature: signatureInfo.signature,
  })

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
    params: shouldSkipSwapRequest ? undefined : swapRequestParams,
    // Disable polling during e2e testing because it was preventing js thread from going idle
    refetchInterval: isE2EMode ? undefined : tradingApiSwapRequestMs,
    staleTime: tradingApiSwapRequestMs,
    // We add a small buffer in case connection is too slow
    immediateGcTime: tradingApiSwapRequestMs + ONE_SECOND_MS * 5,
  })

  const processSwapResponse = useMemo(() => createProcessSwapResponse({ activeGasStrategy }), [activeGasStrategy])

  const result = useMemo(
    () =>
      processSwapResponse({
        response: data,
        error,
        swapQuote,
        isSwapLoading,
        signature: signatureInfo.signature,
        permitData,
        permitDataLoading: signatureInfo.isLoading,
        swapRequestParams,
        isRevokeNeeded: tokenApprovalInfo?.action === ApprovalAction.RevokeAndPermit2Approve,
      }),
    [
      data,
      error,
      isSwapLoading,
      signatureInfo.signature,
      signatureInfo.isLoading,
      permitData,
      swapQuote,
      swapRequestParams,
      processSwapResponse,
      tokenApprovalInfo?.action,
    ],
  )

  // Only log analytics events once per request
  const previousRequestIdRef = useRef(swapQuoteResponse?.requestId)
  const logSwapRequestErrors = useMemo(() => createLogSwapRequestErrors({ trace, formatter }), [trace, formatter])

  useEffect(() => {
    logSwapRequestErrors({
      result,
      derivedSwapInfo,
      transactionSettings,
      previousRequestId: previousRequestIdRef.current,
    })

    if (swapQuoteResponse) {
      previousRequestIdRef.current = swapQuoteResponse.requestId
    }
  }, [logSwapRequestErrors, result, derivedSwapInfo, transactionSettings, swapQuoteResponse])

  return result
}

/** Extracts classic or bridge quote from a quote response */
function getBridgeOrClassicQuoteResponse({
  quote,
}: {
  quote: QuoteResponse | undefined
}): BridgeQuoteResponse | ClassicQuoteResponse | undefined {
  if (quote && (isClassic(quote) || isBridge(quote))) {
    return quote
  }
  return undefined
}

function createLogSwapRequestErrors({
  trace,
  formatter,
}: {
  trace: ITraceContext
  formatter: LocalizationContextState
}) {
  return function logSwapRequestErrors({
    result,
    derivedSwapInfo,
    transactionSettings,
    previousRequestId,
  }: {
    result: TransactionRequestInfo
    derivedSwapInfo: DerivedSwapInfo
    transactionSettings: TransactionSettingsContextState
    previousRequestId: string | undefined
  }): void {
    const quote = derivedSwapInfo.trade.trade?.quote
    const isNewQuote = quote?.requestId !== previousRequestId

    // Only log errors if we have a new valid quote
    if (!quote || !isNewQuote) {
      return
    }

    const swapQuote = getBridgeOrClassicQuoteResponse({ quote })?.quote

    if (result.gasFeeResult.error) {
      logger.warn('useTransactionRequestInfo', 'useTransactionRequestInfo', UNKNOWN_SIM_ERROR, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, transactionSettings, formatter, trace }),
        // we explicitly log it here to show on Datadog dashboard
        chainLabel: getChainLabel(derivedSwapInfo.chainId),
        error: result.gasFeeResult.error,
        simulationFailureReasons: isClassicQuote(swapQuote) ? swapQuote?.txFailureReasons : undefined,
        txRequest: result.transactionRequest,
      })

      if (!(isMobileApp || isExtension)) {
        sendAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
          ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, transactionSettings, formatter, trace }),
          error: result.gasFeeResult.error,
          txRequest: result.transactionRequest,
          simulationFailureReasons: isClassicQuote(swapQuote) ? swapQuote?.txFailureReasons : undefined,
        })
      }
    }
  }
}

function processUniswapXResponse({
  wrapTransactionRequestInfo,
  permitSignature,
  permitData,
  permitDataLoading,
  needsWrap,
}: {
  wrapTransactionRequestInfo: TransactionRequestInfo
  permitSignature: string | undefined
  permitData: NullablePermit | undefined
  permitDataLoading: boolean
  needsWrap: boolean
}): TransactionRequestInfo {
  if (needsWrap) {
    return {
      ...wrapTransactionRequestInfo, // Extend the wrap response if a wrap is needed
      permitSignature,
      permitData,
      permitDataLoading,
    }
  }

  return {
    gasFeeResult: { value: '0', displayValue: '0', error: null, isLoading: false }, // Set a 0 gas fee when no wrap is needed
    gasEstimate: {},
    transactionRequest: undefined,
    swapRequestArgs: undefined,
    permitSignature,
    permitData,
    permitDataLoading,
  }
}

function useUniswapXTransactionRequestInfo({
  derivedSwapInfo,
  wrapTransactionRequestInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  wrapTransactionRequestInfo: TransactionRequestInfo
}): TransactionRequestInfo {
  const isWrapApplicable = getIsWrapApplicable({ derivedSwapInfo })

  const permitData = derivedSwapInfo.trade.trade?.quote?.permitData

  // On interface, we do not fetch signature until after swap is clicked, as it requires user interaction.
  const signatureInfo = usePermit2SignatureWithData({ permitData, skip: isInterface })

  return useMemo(
    () =>
      processUniswapXResponse({
        wrapTransactionRequestInfo,
        permitSignature: signatureInfo.signature,
        permitDataLoading: signatureInfo.isLoading,
        permitData,
        needsWrap: isWrapApplicable,
      }),
    [wrapTransactionRequestInfo, signatureInfo.signature, signatureInfo.isLoading, permitData, isWrapApplicable],
  )
}

export function useTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
  account,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
  account?: AccountMeta
}): TransactionRequestInfo {
  const wrapTransactionRequestInfo = useWrapTransactionRequestInfo({
    derivedSwapInfo,
    account,
  })

  const uniswapXTransactionRequestInfo = useUniswapXTransactionRequestInfo({
    derivedSwapInfo,
    wrapTransactionRequestInfo,
  })

  const swapTransactionRequestInfo = useSwapTransactionRequestInfo({
    derivedSwapInfo,
    tokenApprovalInfo,
  })

  if (derivedSwapInfo.trade.trade && isUniswapX(derivedSwapInfo.trade.trade)) {
    return uniswapXTransactionRequestInfo
  } else if (getIsWrapApplicable({ derivedSwapInfo })) {
    return wrapTransactionRequestInfo
  } else {
    return swapTransactionRequestInfo
  }
}
