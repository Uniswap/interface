/* eslint-disable max-lines */

import type {
  BridgeQuoteResponse,
  ClassicQuoteResponse,
  DiscriminatedQuoteResponse,
  GasEstimate,
  GasStrategy,
  UnwrapQuoteResponse,
  WrapQuoteResponse,
} from '@universe/api'
import { TradingApi } from '@universe/api'
import type { providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { convertGasFeeToDisplayValue, useActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'uniswap/src/features/transactions/swap/analytics'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import {
  SlippageTooLowError,
  UnknownSimulationError,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import type { SwapData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import type {
  BaseSwapTxAndGasInfo,
  BridgeSwapTxAndGasInfo,
  ClassicSwapTxAndGasInfo,
  SwapGasFeeEstimation,
  WrapSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type {
  BridgeTrade,
  ClassicTrade,
  TokenApprovalInfo,
  UnwrapTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { mergeGasFeeResults } from 'uniswap/src/features/transactions/swap/utils/gas'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  validatePermit,
  validateTransactionRequest,
  validateTransactionRequests,
} from 'uniswap/src/features/transactions/swap/utils/trade'
import { SWAP_GAS_URGENCY_OVERRIDE } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { isExtensionApp, isMobileApp, isWebApp } from 'utilities/src/platform'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

export interface TransactionRequestInfo {
  txRequests: providers.TransactionRequest[] | undefined
  permitData?: TradingApi.NullablePermit
  gasFeeResult: GasFeeResult
  gasEstimate: SwapGasFeeEstimation
  swapRequestArgs: TradingApi.CreateSwapRequest | undefined
  includesDelegation?: boolean
}

export function processWrapResponse({
  gasFeeResult,
  wrapTxRequest,
  fallbackGasParams,
}: {
  gasFeeResult: GasFeeResult
  wrapTxRequest: providers.TransactionRequest | undefined
  fallbackGasParams?: providers.TransactionRequest
}): TransactionRequestInfo {
  const gasParams = gasFeeResult.params ?? fallbackGasParams ?? {}

  const wrapTxRequestWithGasFee = { ...wrapTxRequest, ...gasParams }

  const gasEstimate: SwapGasFeeEstimation = {
    wrapEstimate: gasFeeResult.gasEstimate,
  }

  return {
    gasFeeResult,
    txRequests: [wrapTxRequestWithGasFee],
    gasEstimate,
    swapRequestArgs: undefined,
  }
}

export function createPrepareSwapRequestParams({ gasStrategy }: { gasStrategy: GasStrategy }) {
  return function prepareSwapRequestParams({
    swapQuoteResponse,
    signature,
    transactionSettings,
    alreadyApproved,
    overrideSimulation,
  }: {
    swapQuoteResponse: ClassicQuoteResponse | BridgeQuoteResponse | WrapQuoteResponse | UnwrapQuoteResponse
    signature: string | undefined
    transactionSettings: TransactionSettings
    alreadyApproved: boolean
    overrideSimulation?: boolean
  }): TradingApi.CreateSwapRequest {
    const isBridgeTrade = swapQuoteResponse.routing === TradingApi.Routing.BRIDGE
    const permitData = swapQuoteResponse.permitData

    /**
     * Simulate transactions to ensure they will not fail on-chain.
     * Do not simulate for bridge transactions or txs that need an approval
     * as those require Tenderly to simulate and it is not currently integrated into the gas service
     *
     * If overrideSimulation is true (such as when using 7702 endpoint), that takes precedence.
     */
    const shouldSimulateTxn = overrideSimulation ?? (isBridgeTrade ? false : alreadyApproved)

    const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline)

    return {
      quote: swapQuoteResponse.quote,
      permitData: permitData ?? undefined,
      signature,
      simulateTransaction: shouldSimulateTxn,
      deadline,
      refreshGasPrice: true,
      gasStrategies: [gasStrategy],
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
    }
  }
}

export function getSwapInputExceedsBalance({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): boolean {
  const { currencyBalances, currencyAmounts } = derivedSwapInfo
  const currencyAmount = currencyAmounts[CurrencyField.INPUT]
  const currencyBalance = currencyBalances[CurrencyField.INPUT]

  return Boolean(currencyBalance && currencyAmount && currencyBalance.lessThan(currencyAmount))
}

export function getShouldSkipSwapRequest({
  derivedSwapInfo,
  tokenApprovalInfo,
  signature,
  permitsDontNeedSignature,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
  signature: string | undefined
  permitsDontNeedSignature?: boolean
}): boolean {
  const { trade } = derivedSwapInfo.trade

  const requiresPermit2Sig = !!trade?.quote.permitData
  const missingSig = requiresPermit2Sig && !signature && !permitsDontNeedSignature
  const approvalInfoMissing = !tokenApprovalInfo?.action || tokenApprovalInfo.action === ApprovalAction.Unknown

  return getSwapInputExceedsBalance({ derivedSwapInfo }) || approvalInfoMissing || missingSig
}

/** Returns an error if simulation fails on backend and we expect the swap transaction to fail */
export function getSimulationError({
  swapQuote,
  isRevokeNeeded,
}: {
  swapQuote: TradingApi.ClassicQuote | TradingApi.BridgeQuote | undefined
  isRevokeNeeded: boolean
}): Error | null {
  if (!swapQuote || !('txFailureReasons' in swapQuote)) {
    return null
  }

  const validSimulationErrors = swapQuote.txFailureReasons?.filter((reason) => {
    const isExpectedErrorFromRevoke = isRevokeNeeded && reason === TradingApi.TransactionFailureReason.SIMULATION_ERROR
    return !isExpectedErrorFromRevoke
  })

  // TODO(SWAP-415): review why we're only returning some errors and ignoring the rest.

  if (validSimulationErrors?.includes(TradingApi.TransactionFailureReason.SLIPPAGE_TOO_LOW)) {
    return new SlippageTooLowError()
  }

  if (validSimulationErrors?.includes(TradingApi.TransactionFailureReason.SIMULATION_ERROR)) {
    return new UnknownSimulationError()
  }

  return null
}

export function createProcessSwapResponse({ gasStrategy }: { gasStrategy: GasStrategy }) {
  return function processSwapResponse({
    response,
    error,
    swapQuote,
    isSwapLoading,
    permitData,
    swapRequestParams,
    isRevokeNeeded,
    permitsDontNeedSignature,
  }: {
    response: SwapData | undefined
    error: Error | null
    swapQuote: TradingApi.ClassicQuote | TradingApi.BridgeQuote | undefined
    isSwapLoading: boolean
    permitData: TradingApi.NullablePermit | undefined
    swapRequestParams: TradingApi.CreateSwapRequest | undefined
    isRevokeNeeded: boolean
    permitsDontNeedSignature?: boolean
  }): TransactionRequestInfo {
    // We use the gasFee estimate from quote, as its more accurate
    const swapGasFee = {
      value: swapQuote?.gasFee,
      displayValue: convertGasFeeToDisplayValue(swapQuote?.gasFee, gasStrategy),
    }

    // This is a case where simulation fails on backend, meaning txn is expected to fail
    const simulationError = getSimulationError({ swapQuote, isRevokeNeeded })

    const gasEstimateError = simulationError ?? error

    const gasFeeResult = {
      value: swapGasFee.value,
      displayValue: swapGasFee.displayValue,
      isLoading: isSwapLoading,
      error: gasEstimateError,
    }

    const gasEstimate: SwapGasFeeEstimation = {
      swapEstimate: response?.gasEstimate,
    }

    return {
      gasFeeResult,
      txRequests: response?.transactions,
      permitData: permitsDontNeedSignature ? undefined : permitData,
      gasEstimate,
      includesDelegation: response?.includesDelegation,
      swapRequestArgs: swapRequestParams,
    }
  }
}

export function createLogSwapRequestErrors({ trace }: { trace: ITraceContext }) {
  return function logSwapRequestErrors({
    txRequest,
    gasFeeResult,
    derivedSwapInfo,
    transactionSettings,
    previousRequestId,
  }: {
    txRequest: providers.TransactionRequest | undefined
    gasFeeResult: GasFeeResult
    derivedSwapInfo: DerivedSwapInfo
    transactionSettings: TransactionSettings
    previousRequestId: string | undefined
  }): void {
    const quote = derivedSwapInfo.trade.trade?.quote
    const isNewQuote = quote?.requestId !== previousRequestId

    // Only log errors if we have a new valid quote
    if (!quote || !isNewQuote) {
      return
    }

    const quoteId = 'quoteId' in quote.quote ? quote.quote.quoteId : undefined

    // TODO(SWAP-415): review how we're logging these errors to avoid spamming the logs with things we don't need to log.
    if (gasFeeResult.error) {
      const extra = {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, transactionSettings, trace }),
        // we explicitly log it here to show on Datadog dashboard
        chainLabel: getChainLabel(derivedSwapInfo.chainId),
        requestId: quote.requestId,
        quoteId,
        error: gasFeeResult.error,
        simulationFailureReasons: isClassic(quote) ? quote.quote.txFailureReasons : undefined,
        txRequest,
      }

      if (gasFeeResult.error instanceof UnknownSimulationError || gasFeeResult.error instanceof SlippageTooLowError) {
        logger.warn('utils', 'logSwapRequestErrors', gasFeeResult.error.message, extra)
      } else {
        const gasFeeResultError = new Error('Failed to get gas estimate')
        gasFeeResultError.cause = gasFeeResult.error

        logger.error(gasFeeResultError, {
          tags: {
            file: 'swapTxAndGasInfoService/utils.ts',
            function: 'logSwapRequestErrors',
          },
          extra: {
            errorMessage: gasFeeResult.error.message,
            ...extra,
          },
        })
      }

      if (!(isMobileApp || isExtensionApp)) {
        sendAnalyticsEvent(SwapEventName.SwapEstimateGasCallFailed, {
          ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, transactionSettings, trace }),
          error: gasFeeResult.error,
          txRequest,
          simulationFailureReasons: isClassic(quote) ? quote.quote.txFailureReasons : undefined,
        })
      }
    }
  }
}

export function createGasFields({
  swapTxInfo,
  approvalTxInfo,
  permitTxInfo = EMPTY_PERMIT_TX_INFO,
}: {
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
  permitTxInfo?: {
    gasFeeResult: GasFeeResult
    gasEstimate?: GasEstimate
  }
}): Pick<BaseSwapTxAndGasInfo, 'gasFee' | 'gasFeeEstimation'> {
  const { approvalGasFeeResult, revokeGasFeeResult } = approvalTxInfo
  // Gas fees for: swap from quote response directly, wrap from Gas Fee API, approvals from checkApprovalQuery
  const gasFee = mergeGasFeeResults(
    swapTxInfo.gasFeeResult,
    approvalGasFeeResult,
    revokeGasFeeResult,
    permitTxInfo.gasFeeResult,
  )

  const gasFeeEstimation: SwapGasFeeEstimation = {
    ...swapTxInfo.gasEstimate,
    approvalEstimate: approvalGasFeeResult.gasEstimate,
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
  const approveTxRequest = validateTransactionRequest(tokenApprovalInfo.txRequest)
  const revocationTxRequest = validateTransactionRequest(tokenApprovalInfo.cancelTxRequest)

  return {
    approveTxRequest,
    revocationTxRequest,
  }
}

export function getClassicSwapTxAndGasInfo({
  trade,
  swapTxInfo,
  approvalTxInfo,
  permitTxInfo,
}: {
  trade: ClassicTrade
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
  permitTxInfo: PermitTxInfo
  includesDelegation?: boolean
}): ClassicSwapTxAndGasInfo {
  const txRequests = validateTransactionRequests(swapTxInfo.txRequests)
  const unsigned = Boolean(isWebApp && swapTxInfo.permitData)
  const typedData = validatePermit(swapTxInfo.permitData)

  const permit = typedData
    ? ({ method: PermitMethod.TypedData, typedData } as const)
    : permitTxInfo.permitTxRequest
      ? ({ method: PermitMethod.Transaction, txRequest: permitTxInfo.permitTxRequest } as const)
      : undefined

  return {
    routing: trade.routing,
    trade,
    ...createGasFields({ swapTxInfo, approvalTxInfo, permitTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    swapRequestArgs: swapTxInfo.swapRequestArgs,
    unsigned,
    txRequests,
    permit,
    includesDelegation: swapTxInfo.includesDelegation,
  }
}

type PermitTxInfo = {
  permitTxRequest: ValidatedTransactionRequest | undefined
  gasFeeResult: GasFeeResult
  gasEstimate?: GasEstimate
}

const EMPTY_PERMIT_TX_INFO: PermitTxInfo = {
  permitTxRequest: undefined,
  gasFeeResult: {
    value: '0',
    displayValue: '0',
    isLoading: false,
    error: null,
  },
}

export function usePermitTxInfo({
  quote,
}: {
  quote?: DiscriminatedQuoteResponse | SolanaTrade['quote']
}): PermitTxInfo {
  const classicQuote = quote && isClassic(quote) ? quote : undefined
  const gasStrategy = useActiveGasStrategy(classicQuote?.quote.chainId, 'swap')

  const getPermitTxInfo = useMemo(() => createGetPermitTxInfo({ gasStrategy }), [gasStrategy])
  return useMemo(() => {
    if (!classicQuote) {
      return EMPTY_PERMIT_TX_INFO
    }

    return getPermitTxInfo({ quote: classicQuote })
  }, [getPermitTxInfo, classicQuote])
}

export function createGetPermitTxInfo({ gasStrategy }: { gasStrategy: GasStrategy }) {
  return function getPermitTxInfo({ quote }: { quote: ClassicQuoteResponse }): PermitTxInfo {
    const permitTxRequest = validateTransactionRequest(quote.permitTransaction)

    if (!permitTxRequest) {
      return EMPTY_PERMIT_TX_INFO
    }

    return {
      permitTxRequest,
      gasFeeResult: {
        value: quote.permitGasFee,
        displayValue: convertGasFeeToDisplayValue(quote.permitGasFee, gasStrategy),
        isLoading: false,
        error: null,
      },
    }
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
  const txRequests = validateTransactionRequests(swapTxInfo.txRequests)

  return {
    routing: trade.routing,
    trade,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    txRequests,
    includesDelegation: swapTxInfo.includesDelegation,
  }
}

export function getWrapTxAndGasInfo({
  trade,
  swapTxInfo,
}: {
  trade: WrapTrade | UnwrapTrade
  swapTxInfo: TransactionRequestInfo
}): ClassicSwapTxAndGasInfo | WrapSwapTxAndGasInfo {
  const txRequests = validateTransactionRequests(swapTxInfo.txRequests)

  return {
    routing: trade.routing,
    trade,
    txRequests,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: swapTxInfo.gasFeeResult,
    gasFeeEstimation: swapTxInfo.gasEstimate,
    includesDelegation: swapTxInfo.includesDelegation,
  }
}

export function getFallbackSwapTxAndGasInfo({
  swapTxInfo,
  approvalTxInfo,
}: {
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
}): ClassicSwapTxAndGasInfo {
  const txRequests = validateTransactionRequests(swapTxInfo.txRequests)

  return {
    routing: TradingApi.Routing.CLASSIC,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    txRequests,
    permit: undefined,
    swapRequestArgs: swapTxInfo.swapRequestArgs,
    unsigned: false,
    includesDelegation: swapTxInfo.includesDelegation,
  }
}
