import { useEffect, useMemo, useRef } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useActiveGasStrategy, useShadowGasStrategies, useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/contexts/hooks/usePermit2Signature'
import { useWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/contexts/hooks/useWrapTransactionRequest'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import {
  FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  WRAP_FALLBACK_GAS_LIMIT_IN_GWEI,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { processUniswapXResponse } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import {
  TransactionRequestInfo,
  createLogSwapRequestErrors,
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getBridgeOrClassicQuoteResponse,
  getIsWrapApplicable,
  getShouldSkipSwapRequest,
  processWrapResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { isInterface } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

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

  const { isSmartContractAddress } = useIsSmartContractAddress(account?.address, derivedSwapInfo.chainId)

  // When gas estimation fails for smart-contract accounts during an unwrap, fall back to a
  // hard-coded gas limit.
  const fallbackGasParams = useMemo(() => {
    const shouldFallback =
      !gasFeeResult.params && isInterface && derivedSwapInfo?.wrapType === WrapType.Unwrap && isSmartContractAddress

    return shouldFallback ? { gasLimit: WRAP_FALLBACK_GAS_LIMIT_IN_GWEI * 10e9 } : undefined
  }, [gasFeeResult.params, derivedSwapInfo.wrapType, isSmartContractAddress])

  const result = useMemo(
    () => processWrapResponse({ gasFeeResult, wrapTxRequest, fallbackGasParams }),
    [gasFeeResult, wrapTxRequest, fallbackGasParams],
  )

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

export function useSwapTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
}): TransactionRequestInfo {
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

    const alreadyApproved = tokenApprovalInfo?.action === ApprovalAction.None && !swapQuoteResponse.permitTransaction

    return prepareSwapRequestParams({
      swapQuoteResponse,
      signature: signatureInfo.signature,
      transactionSettings,
      alreadyApproved,
    })
  }, [
    prepareSwapRequestParams,
    swapQuoteResponse,
    signatureInfo.signature,
    transactionSettings,
    tokenApprovalInfo?.action,
  ])

  const canBatchTransactions = useUniswapContextSelector((ctx) =>
    ctx.getCanBatchTransactions?.(derivedSwapInfo.chainId),
  )
  const swapDelegationAddress = useUniswapContextSelector((ctx) =>
    ctx.getSwapDelegationAddress?.(derivedSwapInfo.chainId),
  )

  const permitsDontNeedSignature = !!canBatchTransactions
  const shouldSkipSwapRequest = getShouldSkipSwapRequest({
    derivedSwapInfo,
    tokenApprovalInfo,
    signature: signatureInfo.signature,
    permitsDontNeedSignature,
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
  } = useTradingApiSwapQuery(
    {
      params: shouldSkipSwapRequest ? undefined : swapRequestParams,
      refetchInterval: tradingApiSwapRequestMs,
      staleTime: tradingApiSwapRequestMs,
      // We add a small buffer in case connection is too slow
      immediateGcTime: tradingApiSwapRequestMs + ONE_SECOND_MS * 5,
    },
    { canBatchTransactions, swapDelegationAddress },
  )

  const processSwapResponse = useMemo(() => createProcessSwapResponse({ activeGasStrategy }), [activeGasStrategy])

  const result = useMemo(
    () =>
      processSwapResponse({
        response: data,
        error,
        swapQuote,
        isSwapLoading,
        permitData,
        swapRequestParams,
        isRevokeNeeded: tokenApprovalInfo?.action === ApprovalAction.RevokeAndPermit2Approve,
        permitsDontNeedSignature,
      }),
    [
      data,
      error,
      isSwapLoading,
      permitData,
      swapQuote,
      swapRequestParams,
      processSwapResponse,
      tokenApprovalInfo?.action,
      permitsDontNeedSignature,
    ],
  )

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

function useUniswapXTransactionRequestInfo({
  derivedSwapInfo,
  wrapTransactionRequestInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  wrapTransactionRequestInfo: TransactionRequestInfo
}): TransactionRequestInfo {
  const isWrapApplicable = getIsWrapApplicable({ derivedSwapInfo })

  const permitData = derivedSwapInfo.trade.trade?.quote?.permitData

  return useMemo(
    () =>
      processUniswapXResponse({
        wrapTransactionRequestInfo,
        permitData,
        needsWrap: isWrapApplicable,
      }),
    [wrapTransactionRequestInfo, permitData, isWrapApplicable],
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
