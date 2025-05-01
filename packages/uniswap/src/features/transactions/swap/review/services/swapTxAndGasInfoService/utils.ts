import { SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers/lib/ethers'
import {
  BridgeQuoteResponse,
  ClassicQuoteResponse,
  WithV4Flag,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
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
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult, areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'uniswap/src/features/transactions/swap/analytics'
import { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { UNKNOWN_SIM_ERROR } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import {
  BaseSwapTxAndGasInfo,
  BridgeSwapTxAndGasInfo,
  ClassicSwapTxAndGasInfo,
  SwapGasFeeEstimation,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  ApprovalAction,
  BridgeTrade,
  ClassicTrade,
  TokenApprovalInfo,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { mergeGasFeeResults } from 'uniswap/src/features/transactions/swap/utils/gas'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { SWAP_GAS_URGENCY_OVERRIDE, isClassicQuote } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isInterface, isMobileApp } from 'utilities/src/platform'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

export interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
  permitData?: NullablePermit
  gasFeeResult: GasFeeResult
  gasEstimate: SwapGasFeeEstimation
  swapRequestArgs: CreateSwapRequest | undefined
}

export function processWrapResponse({
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
    gasEstimate,
    swapRequestArgs: undefined,
  }
}

export function createPrepareSwapRequestParams({
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

export function getShouldSkipSwapRequest({
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

/** Returns an error if simulation fails on backend and we expect the swap transaction to fail */
export function getSimulationError({
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

export function createProcessSwapResponse({ activeGasStrategy }: { activeGasStrategy: GasStrategy }) {
  return function processSwapResponse({
    response,
    error,
    swapQuote,
    isSwapLoading,
    permitData,
    swapRequestParams,
    isRevokeNeeded,
  }: {
    response: CreateSwapResponse | undefined
    error: Error | null
    swapQuote: ClassicQuote | BridgeQuote | undefined
    isSwapLoading: boolean
    permitData: NullablePermit | undefined
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
      permitData,
      gasEstimate,
      swapRequestArgs: swapRequestParams,
    }
  }
}

export function getIsWrapApplicable({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): boolean {
  const { trade } = derivedSwapInfo.trade

  const isUniswapXWrap = trade && isUniswapX(trade) && trade.needsWrap
  return Boolean(derivedSwapInfo.wrapType !== WrapType.NotApplicable || isUniswapXWrap)
}

/** Extracts classic or bridge quote from a quote response */
export function getBridgeOrClassicQuoteResponse({
  quote,
}: {
  quote: QuoteResponse | undefined
}): BridgeQuoteResponse | ClassicQuoteResponse | undefined {
  if (quote && (isClassic(quote) || isBridge(quote))) {
    return quote
  }
  return undefined
}

export function createLogSwapRequestErrors({
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
        requestId: quote?.requestId,
        quoteId: swapQuote?.quoteId,
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

export function createGasFields({
  swapTxInfo,
  approvalTxInfo,
}: {
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
}): Pick<BaseSwapTxAndGasInfo, 'gasFee' | 'gasFeeEstimation'> {
  const { approvalGasFeeResult, revokeGasFeeResult } = approvalTxInfo
  // Gas fees for: swap from quote response directly, wrap from Gas Fee API, approvals from checkApprovalQuery
  const gasFee = mergeGasFeeResults(swapTxInfo.gasFeeResult, approvalGasFeeResult, revokeGasFeeResult)
  const gasFeeEstimation: SwapGasFeeEstimation = {
    ...swapTxInfo.gasEstimate,
    approvalEstimates: approvalGasFeeResult.gasEstimates,
  }

  return {
    gasFee,
    gasFeeEstimation,
  }
}

export function createApprovalFields({
  approvalTxInfo,
}: {
  approvalTxInfo: ApprovalTxInfo
}): Pick<BaseSwapTxAndGasInfo, 'approveTxRequest' | 'revocationTxRequest'> {
  const { tokenApprovalInfo } = approvalTxInfo
  const approveTxRequest = validateTransactionRequest(tokenApprovalInfo?.txRequest)
  const revocationTxRequest = validateTransactionRequest(tokenApprovalInfo?.cancelTxRequest)

  return {
    approveTxRequest,
    revocationTxRequest,
  }
}

export function getClassicSwapTxAndGasInfo({
  trade,
  swapTxInfo,
  approvalTxInfo,
}: {
  trade: ClassicTrade
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
}): ClassicSwapTxAndGasInfo {
  const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)
  const unsigned = Boolean(isInterface && swapTxInfo.permitData)
  const permit = validatePermit(swapTxInfo.permitData)

  return {
    routing: trade.routing,
    trade,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    swapRequestArgs: swapTxInfo.swapRequestArgs,
    unsigned,
    txRequest,
    permit,
  }
}

export function getBridgeSwapTxAndGasInfo({
  trade,
  swapTxInfo,
  approvalTxInfo,
}: {
  trade: BridgeTrade
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
}): BridgeSwapTxAndGasInfo {
  const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)

  return {
    routing: trade.routing,
    trade,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    txRequest,
  }
}

export function getWrapTxAndGasInfo({ swapTxInfo }: { swapTxInfo: TransactionRequestInfo }): ClassicSwapTxAndGasInfo {
  const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)

  return {
    routing: Routing.CLASSIC,
    txRequest,
    swapRequestArgs: swapTxInfo.swapRequestArgs,
    permit: undefined,
    unsigned: false,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: swapTxInfo.gasFeeResult,
    gasFeeEstimation: swapTxInfo.gasEstimate,
  }
}

export function getFallbackSwapTxAndGasInfo({
  swapTxInfo,
  approvalTxInfo,
}: {
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
}): ClassicSwapTxAndGasInfo {
  const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)

  return {
    routing: Routing.CLASSIC,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    txRequest,
    permit: undefined,
    swapRequestArgs: swapTxInfo.swapRequestArgs,
    unsigned: false,
  }
}
