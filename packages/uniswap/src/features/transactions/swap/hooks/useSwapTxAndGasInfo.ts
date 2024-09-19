import { providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { OrderRequest, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { EstimatedGasFeeDetails } from 'uniswap/src/features/telemetry/types'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/hooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/hooks/useTransactionRequestInfo'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import {
  ApprovalAction,
  ClassicTrade,
  IndicativeTrade,
  Trade,
  UniswapXTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { sumGasFees } from 'uniswap/src/features/transactions/swap/utils/gas'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo

export type UniswapXGasBreakdown = {
  classicGasUseEstimateUSD?: string
  approvalCost?: string
  wrapCost?: string
  inputTokenSymbol?: string
}

export type GasFeeEstimation = {
  swapFee?: EstimatedGasFeeDetails
  approvalFee?: EstimatedGasFeeDetails
}

export type ClassicSwapTxAndGasInfo = {
  routing: Routing.CLASSIC
  trade?: ClassicTrade
  indicativeTrade: IndicativeTrade | undefined
  txRequest?: ValidatedTransactionRequest
  approveTxRequest: ValidatedTransactionRequest | undefined
  gasFee: GasFeeResult
  gasFeeEstimation: GasFeeEstimation
  approvalError: boolean
}

export type UniswapXSwapTxAndGasInfo = {
  routing: Routing.DUTCH_V2
  trade: UniswapXTrade
  indicativeTrade: IndicativeTrade | undefined
  wrapTxRequest: ValidatedTransactionRequest | undefined
  approveTxRequest: ValidatedTransactionRequest | undefined
  orderParams?: OrderRequest
  gasFee: GasFeeResult
  gasFeeBreakdown: UniswapXGasBreakdown
  approvalError: boolean
}

export type ValidatedTransactionRequest = providers.TransactionRequest & { to: string; chainId: number }
function validateTransactionRequest(
  request?: providers.TransactionRequest | null,
): ValidatedTransactionRequest | undefined {
  if (request?.to && request.chainId) {
    return { ...request, to: request.to, chainId: request.chainId }
  }
  return undefined
}

export function useSwapTxAndGasInfo({
  derivedSwapInfo,
  account,
}: {
  derivedSwapInfo: DerivedSwapInfo
  account?: AccountMeta
}): SwapTxAndGasInfo {
  const {
    chainId,
    wrapType,
    currencyAmounts,
    trade: { trade, indicativeTrade },
  } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo({
    account,
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    routing: trade?.routing,
  })

  // TODO(MOB-3425) decouple wrap tx from swap tx to simplify UniswapX code
  const swapTxInfo = useTransactionRequestInfo({
    account,
    derivedSwapInfo,
    // Dont send transaction request if invalid or missing approval data
    skip: !tokenApprovalInfo?.action || tokenApprovalInfo.action === ApprovalAction.Unknown,
    tokenApprovalInfo,
  })

  return useMemo(() => {
    const approvalError = tokenApprovalInfo?.action === ApprovalAction.Unknown

    const gasFeeEstimation: GasFeeEstimation = {
      swapFee: swapTxInfo.gasFeeEstimation,
      approvalFee: tokenApprovalInfo
        ? {
            gasUseEstimate: tokenApprovalInfo.txRequest?.gasLimit?.toString(),
            maxFeePerGas: tokenApprovalInfo.txRequest?.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: tokenApprovalInfo.txRequest?.maxPriorityFeePerGas?.toString(),
            gasFee: tokenApprovalInfo.gasFee,
          }
        : undefined,
    }

    const gasFee = getTotalGasFee(trade, swapTxInfo.gasFeeResult, tokenApprovalInfo, approvalError)

    const approveTxRequest = validateTransactionRequest(tokenApprovalInfo?.txRequest)

    if (trade?.routing === Routing.DUTCH_V2) {
      const signature = swapTxInfo.permitSignature
      const orderParams = signature ? { signature, quote: trade.quote.quote, routing: Routing.DUTCH_V2 } : undefined
      const gasFeeBreakdown: UniswapXGasBreakdown = {
        classicGasUseEstimateUSD: trade.quote.quote.classicGasUseEstimateUSD,
        approvalCost: tokenApprovalInfo?.gasFee,
        wrapCost: swapTxInfo.gasFeeResult.value,
        inputTokenSymbol: trade.inputAmount.currency.wrapped.symbol,
      }

      return {
        routing: Routing.DUTCH_V2,
        trade,
        indicativeTrade,
        wrapTxRequest: validateTransactionRequest(swapTxInfo.transactionRequest),
        approveTxRequest,
        orderParams,
        gasFee,
        gasFeeBreakdown,
        approvalError,
      }
    } else {
      return {
        routing: Routing.CLASSIC,
        trade: trade ?? undefined,
        indicativeTrade,
        txRequest: validateTransactionRequest(swapTxInfo.transactionRequest),
        approveTxRequest,
        gasFee,
        gasFeeEstimation,
        approvalError,
      }
    }
  }, [
    indicativeTrade,
    swapTxInfo.gasFeeEstimation,
    swapTxInfo.gasFeeResult,
    swapTxInfo.permitSignature,
    swapTxInfo.transactionRequest,
    tokenApprovalInfo,
    trade,
  ])
}

type TokenApprovalInfoWithGas = ReturnType<typeof useTokenApprovalInfo>
function getTotalGasFee(
  trade: Trade | null,
  swapGasResult: GasFeeResult,
  tokenApprovalInfo: TokenApprovalInfoWithGas,
  approvalError: boolean,
): GasFeeResult {
  const isLoading = !tokenApprovalInfo || swapGasResult.isLoading
  const error = swapGasResult.error ?? approvalError ? new Error('Approval action unknown') : null

  const isGaslessSwap = trade && isUniswapX(trade) && !trade.needsWrap
  const approvalGasFeeMissing = !tokenApprovalInfo
  const swapGasFeeMissing = !swapGasResult.value && !isGaslessSwap

  // For UniswapX orders with no wrap and no approval, total gas fee is 0.
  if (isGaslessSwap && tokenApprovalInfo?.action === ApprovalAction.None) {
    return { value: '0', error, isLoading }
  }

  // Do not populate gas fee:
  // - If errors exist on swap or approval requests.
  // - If we don't have both the approval and transaction gas fees.
  if (approvalGasFeeMissing || swapGasFeeMissing || approvalError || error) {
    return { value: undefined, error, isLoading }
  }

  const value = sumGasFees(swapGasResult.value, tokenApprovalInfo.gasFee)
  return { value, error, isLoading }
}
