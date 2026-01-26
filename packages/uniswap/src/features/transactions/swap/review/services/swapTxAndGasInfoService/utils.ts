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
import { SwapRouter as V3SwapRouter } from '@uniswap/router-sdk'
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
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import {
  validatePermit,
  validateTransactionRequest,
  validateTransactionRequests,
} from 'uniswap/src/features/transactions/swap/utils/trade'
import { SWAP_GAS_URGENCY_OVERRIDE } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { CurrencyField } from 'uniswap/src/types/currency'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
    blockTimestamp,
  }: {
    swapQuoteResponse: ClassicQuoteResponse | BridgeQuoteResponse | WrapQuoteResponse | UnwrapQuoteResponse
    signature: string | undefined
    transactionSettings: TransactionSettings
    alreadyApproved: boolean
    overrideSimulation?: boolean
    blockTimestamp?: bigint | number
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

    const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline, blockTimestamp)

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

/**
 * Calculate gasFee from quote response
 * If gasFee is directly available, use it. Otherwise, calculate from gasPriceWei * gasUseEstimate
 */
function getGasFeeFromQuote(
  swapQuote: TradingApi.ClassicQuote | TradingApi.BridgeQuote | undefined,
  gasStrategy: GasStrategy,
): { value: string | undefined; displayValue: string | undefined } {
  if (!swapQuote) {
    return { value: undefined, displayValue: undefined }
  }

  // Try to use gasFee directly if available
  if ('gasFee' in swapQuote && swapQuote.gasFee) {
    return {
      value: swapQuote.gasFee,
      displayValue: convertGasFeeToDisplayValue(swapQuote.gasFee, gasStrategy),
    }
  }

  // Calculate from gasPriceWei * gasUseEstimate if available
  if ('gasPriceWei' in swapQuote && 'gasUseEstimate' in swapQuote) {
    const gasPriceWei = swapQuote.gasPriceWei
    const gasUseEstimate = swapQuote.gasUseEstimate

    if (gasPriceWei && gasUseEstimate && typeof gasPriceWei === 'string' && typeof gasUseEstimate === 'string') {
      try {
        // Calculate: gasFee = gasPriceWei * gasUseEstimate
        const gasFeeValue = (BigInt(gasPriceWei) * BigInt(gasUseEstimate)).toString()
        return {
          value: gasFeeValue,
          displayValue: convertGasFeeToDisplayValue(gasFeeValue, gasStrategy),
        }
      } catch (error) {
        // If calculation fails, return undefined
        return { value: undefined, displayValue: undefined }
      }
    }
  }

  return { value: undefined, displayValue: undefined }
}

/**
 * Build transaction request from quote methodParameters when swap API response is not available
 */
function getRouterAddressForChain(chainId: number): { routerAddress?: string; routerSource?: string } {
  // Get router address from chainId
  // For HashKey chains, use the first address from CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS if available
  // Otherwise, try to get from UNIVERSAL_ROUTER_ADDRESS function
  let routerAddress: string | undefined
  let routerSource: string | undefined

  // Try to get from CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS first (for HashKey chains)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS } = require('uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { UniverseChainId: UniverseChainIdEnum } = require('uniswap/src/features/chains/types')

    // Try both numeric key and enum key lookup
    const chainIdAsEnum = chainId as UniverseChainId
    let addresses = CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS[chainIdAsEnum]

    // If not found, try looking up by numeric value (for HashKey chains: 133, 177)
    if (!addresses && (chainId === 133 || chainId === 177)) {
      // Try direct numeric lookup
      addresses = CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS[chainId as keyof typeof CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS]
      // Also try enum lookup
      if (!addresses) {
        const hashKeyEnumValue = chainId === 133 ? UniverseChainIdEnum.HashKeyTestnet : UniverseChainIdEnum.HashKey
        addresses = CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS[hashKeyEnumValue]
      }
    }
    if (addresses && addresses.length > 0) {
      routerAddress = addresses[0]
      routerSource = 'CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS'
    }
  } catch (error) {
    // Ignore error
  }

  // Fallback to UNIVERSAL_ROUTER_ADDRESS if available
  if (!routerAddress) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } = require('@hkdex-tmp/universal_router_sdk')
      routerAddress = UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId)
      routerSource = 'UNIVERSAL_ROUTER_ADDRESS'
    } catch (error) {
      // Ignore error
    }
  }

  return { routerAddress, routerSource }
}

function getGasLimitWithBuffer(
  gasUseEstimate?: string | number,
  { multiplier = 1.2 }: { multiplier?: number } = {},
): string | undefined {
  if (!gasUseEstimate) {
    return undefined
  }
  try {
    const gasUseEstimateStr = String(gasUseEstimate)
    const factor = Math.floor(multiplier * 100)
    const gasLimitWithBuffer = (BigInt(gasUseEstimateStr) * BigInt(factor)) / BigInt(100)
    return gasLimitWithBuffer.toString()
  } catch {
    return undefined
  }
}

function buildTxRequestFromQuote(
  swapQuote: TradingApi.ClassicQuote | TradingApi.BridgeQuote | undefined,
  chainId: number,
): providers.TransactionRequest[] | undefined {
  // Type assertion: methodParameters exists in ClassicQuote but may not be in type definition
  const quoteWithMethodParams = swapQuote as (TradingApi.ClassicQuote | TradingApi.BridgeQuote) & {
    methodParameters?: { calldata: string; value: string }
  }

  if (!quoteWithMethodParams?.methodParameters) {
    return undefined
  }

  const { calldata, value } = quoteWithMethodParams.methodParameters

  if (!calldata) {
    return undefined
  }

  const { routerAddress } = getRouterAddressForChain(chainId)

  if (!routerAddress) {
    // For HashKey chains (133, 177), they may not use Universal Router
    if (chainId === 133 || chainId === 177) {
      logger.error('HashKey chain does not have Universal Router configured', {
        tags: { file: 'utils.ts', function: 'buildTxRequestFromQuote' },
        extra: { chainId },
      })
      return undefined
    }
    logger.error('Could not determine Universal Router address', {
      tags: { file: 'utils.ts', function: 'buildTxRequestFromQuote' },
      extra: { chainId },
    })
    return undefined
  }

  // Build transaction request from quote methodParameters
  // Note: chainId is required for validateTransactionRequest to pass validation
  const txRequest: providers.TransactionRequest = {
    to: routerAddress,
    data: calldata,
    value: value && value !== '0x00' ? value : undefined,
    chainId, // Required for validation
  }

  // Add gas limit from quote if available
  // This is critical - quote's gasUseEstimate is more accurate than provider's estimate
  // Add 20% buffer to gas limit for safety (to account for price changes, etc.)
  const quoteWithGasEstimate = quoteWithMethodParams as (TradingApi.ClassicQuote | TradingApi.BridgeQuote) & {
    gasUseEstimate?: string | number
  }
  const isHashKey = chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet
  // HKSWAP: Increased gas limit multiplier for HashKey chains from 2.0 to 2.5 to prevent gas insufficient errors
  // Increased multiplier for all chains from 1.5 to 2.0 to handle complex multi-hop swaps with nested calls
  const gasLimitBuffered = getGasLimitWithBuffer(quoteWithGasEstimate.gasUseEstimate, {
    multiplier: isHashKey ? 2.5 : 2.0,
  })
  if (gasLimitBuffered) {
    txRequest.gasLimit = gasLimitBuffered
  }

  return [txRequest]
}

function buildTxRequestFromTrade(
  trade: ClassicTrade,
  chainId: number,
  deadline?: number,
): providers.TransactionRequest[] | undefined {
  const { routerAddress } = getRouterAddressForChain(chainId)
  if (!routerAddress) {
    return undefined
  }

  const slippageTolerance = slippageToleranceToPercent(trade.slippageTolerance)
  const deadlineOrPreviousBlockhash = String(deadline ?? trade.deadline ?? 0)
  const feeOptions =
    trade.swapFee?.recipient && trade.swapFee.feeField === CurrencyField.OUTPUT
      ? { fee: trade.swapFee.percent, recipient: trade.swapFee.recipient }
      : undefined

  // HKSWAP: Increased gas limit multiplier for HashKey chains from 2.0 to 2.5 to prevent gas insufficient errors
  // Increased multiplier for all chains from 1.2 to 2.0 to handle complex multi-hop swaps with nested calls
  const gasLimitBuffered = getGasLimitWithBuffer((trade as any)?.quote?.quote?.gasUseEstimate, {
    multiplier: chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet ? 2.5 : 2.0,
  })

  const { calldata, value } = V3SwapRouter.swapCallParameters(trade, {
    slippageTolerance,
    deadlineOrPreviousBlockhash,
    fee: feeOptions,
  })

  const txRequest: providers.TransactionRequest = {
    to: routerAddress,
    data: calldata,
    value: value && value !== '0x00' ? value : undefined,
    chainId,
    ...(gasLimitBuffered ? { gasLimit: gasLimitBuffered } : {}),
  }

  return [txRequest]
}

export function createProcessSwapResponse({ gasStrategy }: { gasStrategy: GasStrategy }) {
  return function processSwapResponse({
    response,
    error,
    swapQuote,
    trade,
    isSwapLoading,
    permitData,
    swapRequestParams,
    isRevokeNeeded,
    permitsDontNeedSignature,
    chainId,
  }: {
    response: SwapData | undefined
    error: Error | null
    swapQuote: TradingApi.ClassicQuote | TradingApi.BridgeQuote | undefined
    trade?: ClassicTrade
    isSwapLoading: boolean
    permitData: TradingApi.NullablePermit | undefined
    swapRequestParams: TradingApi.CreateSwapRequest | undefined
    isRevokeNeeded: boolean
    permitsDontNeedSignature?: boolean
    chainId?: number
  }): TransactionRequestInfo {
    // Try to get chainId from swapQuote if not provided
    let finalChainId = chainId
    if (!finalChainId && swapQuote) {
    // Try to get chainId from quote's token chain IDs
    const quoteWithChainIds = swapQuote as (TradingApi.ClassicQuote | TradingApi.BridgeQuote) & {
      tokenInChainId?: number | string
      tokenOutChainId?: number | string
    }
    const tokenInChainId = 'tokenInChainId' in quoteWithChainIds ? quoteWithChainIds.tokenInChainId : undefined
    const tokenOutChainId = 'tokenOutChainId' in quoteWithChainIds ? quoteWithChainIds.tokenOutChainId : undefined
    
    if (tokenInChainId && typeof tokenInChainId === 'number') {
      finalChainId = tokenInChainId
    } else if (tokenOutChainId && typeof tokenOutChainId === 'number') {
      finalChainId = tokenOutChainId
    }
  }

  // Final fallback: use HashKeyTestnet (133) since we only support HSK chains
  if (!finalChainId) {
    finalChainId = 133 // UniverseChainId.HashKeyTestnet
  }

    // We use the gasFee estimate from quote, as its more accurate
    // Calculate gasFee from quote response (either directly from gasFee or from gasPriceWei * gasUseEstimate)
    const swapGasFee = getGasFeeFromQuote(swapQuote, gasStrategy)

    // This is a case where simulation fails on backend, meaning txn is expected to fail
    const simulationError = getSimulationError({ swapQuote, isRevokeNeeded })

    const gasEstimateError = simulationError ?? error

    // Only set error if there's actually an error (not just an empty object)
    // Check if error is a valid Error instance or has meaningful content
    let finalError: Error | null = null
    if (gasEstimateError) {
      if (gasEstimateError instanceof Error) {
        finalError = gasEstimateError
      } else if (typeof gasEstimateError === 'object' && gasEstimateError !== null) {
        // Check if it's not just an empty object
        const errorKeys = Object.keys(gasEstimateError)
        if (errorKeys.length > 0) {
          // Convert to Error if it has content
          finalError = new Error(JSON.stringify(gasEstimateError))
        }
      }
    }

    const gasFeeResult = {
      value: swapGasFee.value,
      displayValue: swapGasFee.displayValue,
      isLoading: isSwapLoading,
      error: finalError,
    }

    const gasEstimate: SwapGasFeeEstimation = {
      swapEstimate: response?.gasEstimate,
    }

    const isHashKeyChain = finalChainId === UniverseChainId.HashKey || finalChainId === UniverseChainId.HashKeyTestnet

    // Use swap API transactions if available, otherwise build from quote methodParameters
    let txRequests: providers.TransactionRequest[] | undefined

    if (isHashKeyChain && trade) {
      txRequests = buildTxRequestFromTrade(trade, finalChainId, swapRequestParams?.deadline)
      if (!txRequests) {
        logger.error('HashKey chain failed to build SwapRouter02 txRequest from trade', {
          tags: { file: 'utils.ts', function: 'processSwapResponse' },
          extra: { chainId: finalChainId },
        })
      }
    } else if (response?.transactions) {
      txRequests = response.transactions
    } else if (finalChainId && swapQuote) {
      txRequests = buildTxRequestFromQuote(swapQuote, finalChainId)
      if (!txRequests) {
        // This error means swap cannot proceed - txRequests is required
      }
    } else {
      // This should not happen if finalChainId fallback is working correctly
      // But if it does, we should still try to build with finalChainId
      if (finalChainId && swapQuote) {
        txRequests = buildTxRequestFromQuote(swapQuote, finalChainId)
      }
    }

    // HashKey does not provide reliable gas simulation via backend; allow swap flow to proceed.
    if (isHashKeyChain) {
      if (gasFeeResult.value === undefined) {
        gasFeeResult.value = '0'
        gasFeeResult.displayValue = '0'
      }
      if (gasFeeResult.error) {
        gasFeeResult.error = null
      }
    }

    return {
      gasFeeResult,
      txRequests,
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
