import { useMemo } from 'react'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/hooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/hooks/useTransactionRequestInfo'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import {
  SwapGasFeeEstimation,
  SwapTxAndGasInfo,
  UniswapXGasBreakdown,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { sumGasFees } from 'uniswap/src/features/transactions/swap/utils/gas'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { CurrencyField } from 'uniswap/src/types/currency'

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

    const gasFeeEstimation: SwapGasFeeEstimation = {
      swapEstimates: swapTxInfo.gasEstimates,
      approvalEstimates: tokenApprovalInfo?.gasEstimates,
    }

    const gasFee = getTotalGasFee(trade, swapTxInfo.gasFeeResult, tokenApprovalInfo, approvalError)

    const approveTxRequest = validateTransactionRequest(tokenApprovalInfo?.txRequest)
    const revocationTxRequest = validateTransactionRequest(tokenApprovalInfo?.cancelTxRequest)
    const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)

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
        wrapTxRequest: txRequest,
        approveTxRequest,
        revocationTxRequest,
        orderParams,
        gasFee,
        gasFeeBreakdown,
        approvalError,
        permitData: swapTxInfo.permitData,
        permitDataLoading: swapTxInfo.permitDataLoading,
        swapRequestArgs: swapTxInfo.swapRequestArgs,
        permitSignature: swapTxInfo.permitSignature,
      }
    } else {
      return {
        routing: Routing.CLASSIC,
        trade: trade ?? undefined,
        indicativeTrade,
        txRequest,
        approveTxRequest,
        revocationTxRequest,
        gasFee,
        gasFeeEstimation,
        approvalError,
        permitData: swapTxInfo.permitData,
        permitDataLoading: swapTxInfo.permitDataLoading,
        swapRequestArgs: swapTxInfo.swapRequestArgs,
        permitSignature: swapTxInfo.permitSignature,
      }
    }
  }, [
    indicativeTrade,
    swapTxInfo.gasEstimates,
    swapTxInfo.gasFeeResult,
    swapTxInfo.permitSignature,
    swapTxInfo.transactionRequest,
    swapTxInfo.permitData,
    swapTxInfo.permitDataLoading,
    swapTxInfo.swapRequestArgs,
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
  let error = swapGasResult.error ?? approvalError ? new Error('Approval action unknown') : null

  // If swap requires revocation we expect simulation error so set error to null
  if (tokenApprovalInfo?.action === ApprovalAction.RevokeAndPermit2Approve) {
    error = null
  }

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

  const value = sumGasFees([swapGasResult.value, tokenApprovalInfo.gasFee, tokenApprovalInfo.cancelGasFee])
  return { value, error, isLoading }
}
