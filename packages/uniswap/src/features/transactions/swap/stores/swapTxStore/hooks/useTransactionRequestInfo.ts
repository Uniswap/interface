import { TradingApi } from '@universe/api'
import { useEffect, useMemo, useRef } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import { useAllTransactionSettings } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { processUniswapXResponse } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import type { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  createLogSwapRequestErrors,
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/usePermit2Signature'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isClassic, isUniswapX, isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWebApp } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { usePrevious } from 'utilities/src/react/hooks'

// Conditionally import useCurrentBlockTimestamp only on web app
let useCurrentBlockTimestamp: (() => bigint | undefined) | undefined
if (isWebApp) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const useCurrentBlockTimestampModule = require('apps/web/src/hooks/useCurrentBlockTimestamp')
  useCurrentBlockTimestamp = useCurrentBlockTimestampModule.default || useCurrentBlockTimestampModule
}

function useSwapTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
}): TransactionRequestInfo {
  const trace = useTrace()
  const transactionSettings = useAllTransactionSettings()

  const permitData = derivedSwapInfo.trade.trade?.quote.permitData
  // On interface, we do not fetch signature until after swap is clicked, as it requires user interaction.
  const { data: signature } = usePermit2SignatureWithData({ permitData, skip: isWebApp })

  // Keep track of the last successful quote to use if current quote fails
  const lastSuccessfulQuoteRef = useRef<TradingApi.ClassicQuoteResponse | TradingApi.BridgeQuoteResponse | undefined>(
    undefined,
  )

  const swapQuoteResponse = useMemo(() => {
    const quote = derivedSwapInfo.trade.trade?.quote
    if (quote && (isClassic(quote) || isBridge(quote) || isWrap(quote))) {
      // Update the last successful quote
      lastSuccessfulQuoteRef.current = quote
      return quote
    }
    // If current quote is not available, use the last successful quote
    if (lastSuccessfulQuoteRef.current) {
      return lastSuccessfulQuoteRef.current
    }
    return undefined
  }, [derivedSwapInfo.trade.trade?.quote])

  const swapQuote = swapQuoteResponse?.quote

  // Get current chainId from active account if derivedSwapInfo.chainId is not available
  // We only support HSK chains (HashKey = 177, HashKeyTestnet = 133)
  const activeAccount = useActiveAccount(Platform.EVM)
  const currentChainId = (activeAccount as { chainId?: UniverseChainId } | undefined)?.chainId ?? derivedSwapInfo.chainId
  
  // Resolve chainId with multiple fallbacks
  // Priority: 1. currentChainId (from account or derivedSwapInfo), 2. swapQuote tokenInChainId, 3. swapQuote tokenOutChainId, 4. default HashKeyTestnet
  const resolvedChainId = useMemo(() => {
    // First try: use currentChainId if available
    if (currentChainId) {
      return currentChainId
    }

    // Second try: get from swapQuote tokenInChainId
    if (swapQuote && 'tokenInChainId' in swapQuote && swapQuote.tokenInChainId) {
      return swapQuote.tokenInChainId as UniverseChainId
    }

    // Third try: get from swapQuote tokenOutChainId
    if (swapQuote && 'tokenOutChainId' in swapQuote && swapQuote.tokenOutChainId) {
      return swapQuote.tokenOutChainId as UniverseChainId
    }

    // Final fallback: use HashKeyTestnet (133) since we only support HSK chains
    return UniverseChainId.HashKeyTestnet
  }, [currentChainId, swapQuote])
  
  const gasStrategy = useActiveGasStrategy(resolvedChainId, 'general')

  const swapDelegationInfo = useUniswapContextSelector((ctx) => ctx.getSwapDelegationInfo?.(resolvedChainId))
  const overrideSimulation = !!swapDelegationInfo?.delegationAddress

  // Get block timestamp for accurate deadline calculation
  // Only fetch on web app (where useCurrentBlockTimestamp is available)
  const blockTimestamp = isWebApp && useCurrentBlockTimestamp ? useCurrentBlockTimestamp() : undefined


  const prepareSwapRequestParams = useMemo(() => createPrepareSwapRequestParams({ gasStrategy }), [gasStrategy])

  const swapRequestParams = useMemo(() => {
    if (!swapQuoteResponse) {
      return undefined
    }

    const alreadyApproved = tokenApprovalInfo?.action === ApprovalAction.None && !swapQuoteResponse.permitTransaction

    const requestParams = prepareSwapRequestParams({
      swapQuoteResponse,
      signature: signature ?? undefined,
      transactionSettings,
      alreadyApproved,
      overrideSimulation,
      blockTimestamp,
    })

    return requestParams
  }, [
    swapQuoteResponse,
    tokenApprovalInfo?.action,
    prepareSwapRequestParams,
    signature,
    transactionSettings,
    overrideSimulation,
    blockTimestamp,
  ])

  const canBatchTransactions = useUniswapContextSelector((ctx) =>
    ctx.getCanBatchTransactions?.(resolvedChainId),
  )

  const permitsDontNeedSignature = !!canBatchTransactions

  // Skip swap API call - use quote methodParameters directly instead
  // Don't call swap API - we'll use quote methodParameters directly
  const data = undefined
  const error = null
  const isSwapLoading = false

  const processSwapResponse = useMemo(() => createProcessSwapResponse({ gasStrategy }), [gasStrategy])

  const result = useMemo(() => {
    // Ensure resolvedChainId is always defined
    const chainIdToUse = resolvedChainId ?? UniverseChainId.HashKeyTestnet

    const processResult = processSwapResponse({
        response: data,
        error,
        swapQuote,
        trade: derivedSwapInfo.trade.trade ?? undefined,
        isSwapLoading,
        permitData,
        swapRequestParams,
        isRevokeNeeded: tokenApprovalInfo?.action === ApprovalAction.RevokeAndPermit2Approve,
        permitsDontNeedSignature,
      chainId: chainIdToUse,
    })

    return processResult
  }, [
      data,
      error,
      isSwapLoading,
      permitData,
      swapQuote,
      swapRequestParams,
      processSwapResponse,
      tokenApprovalInfo?.action,
      permitsDontNeedSignature,
    resolvedChainId,
    derivedSwapInfo,
    swapQuoteResponse,
    activeAccount,
    currentChainId,
  ])

  // Only log analytics events once per request
  const previousRequestIdRef = useRef(swapQuoteResponse?.requestId)
  const logSwapRequestErrors = useMemo(() => createLogSwapRequestErrors({ trace }), [trace])

  useEffect(() => {
    logSwapRequestErrors({
      txRequest: result.txRequests?.[0],
      gasFeeResult: result.gasFeeResult,
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

function useUniswapXTransactionRequestInfo(permitData: TradingApi.NullablePermit | undefined): TransactionRequestInfo {
  return useMemo(
    () =>
      processUniswapXResponse({
        permitData,
      }),
    [permitData],
  )
}

export function useTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
}): TransactionRequestInfo {
  const uniswapXTransactionRequestInfo = useUniswapXTransactionRequestInfo(
    derivedSwapInfo.trade.trade?.quote.permitData,
  )
  const swapTransactionRequestInfo = useSwapTransactionRequestInfo({ derivedSwapInfo, tokenApprovalInfo })

  if (derivedSwapInfo.trade.trade && isUniswapX(derivedSwapInfo.trade.trade)) {
    return uniswapXTransactionRequestInfo
  }

  return swapTransactionRequestInfo
}
