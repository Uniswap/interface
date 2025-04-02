import { useMemo } from 'react'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTransactionRequestInfo'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import {
  SwapGasFeeEstimation,
  SwapTxAndGasInfo,
  UniswapXGasBreakdown,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { mergeGasFeeResults } from 'uniswap/src/features/transactions/swap/utils/gas'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterface } from 'utilities/src/platform'

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

  const { tokenApprovalInfo, approvalGasFeeResult, revokeGasFeeResult } = useTokenApprovalInfo({
    account,
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    currencyOutAmount: currencyAmounts[CurrencyField.OUTPUT],
    routing: trade?.routing,
  })

  // TODO(MOB-3425) decouple wrap tx from swap tx to simplify UniswapX code
  const swapTxInfo = useTransactionRequestInfo({
    account,
    derivedSwapInfo,
    tokenApprovalInfo,
  })

  return useMemo(() => {
    const gasFeeEstimation: SwapGasFeeEstimation = {
      ...swapTxInfo.gasEstimate,
      approvalEstimates: approvalGasFeeResult.gasEstimates,
    }

    // Gas fees for: swap from quote response directly, wrap from Gas Fee API, approvals from checkApprovalQuery
    const gasFee = mergeGasFeeResults(swapTxInfo.gasFeeResult, approvalGasFeeResult, revokeGasFeeResult)

    const approveTxRequest = validateTransactionRequest(tokenApprovalInfo?.txRequest)
    const revocationTxRequest = validateTransactionRequest(tokenApprovalInfo?.cancelTxRequest)
    const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)
    const permit = validatePermit(swapTxInfo.permitData)
    const unsigned = Boolean(isInterface && swapTxInfo.permitData)

    if (
      trade?.routing === Routing.DUTCH_V2 ||
      trade?.routing === Routing.DUTCH_V3 ||
      trade?.routing === Routing.PRIORITY
    ) {
      const signature = swapTxInfo.permitSignature
      const orderParams = signature ? { signature, quote: trade.quote.quote, routing: Routing.DUTCH_V2 } : undefined
      const gasFeeBreakdown: UniswapXGasBreakdown = {
        classicGasUseEstimateUSD: trade.quote.quote.classicGasUseEstimateUSD,
        approvalCost: approvalGasFeeResult?.displayValue,
        wrapCost: swapTxInfo.gasFeeResult.displayValue,
        inputTokenSymbol: trade.inputAmount.currency.wrapped.symbol,
      }

      return {
        routing: trade.routing,
        trade,
        indicativeTrade,
        wrapTxRequest: txRequest,
        approveTxRequest,
        revocationTxRequest,
        orderParams,
        gasFee,
        gasFeeEstimation,
        gasFeeBreakdown,
        permit,
      }
    } else if (trade?.routing === Routing.BRIDGE) {
      return {
        routing: Routing.BRIDGE,
        trade,
        indicativeTrade: undefined, // Bridge trades don't have indicative trades
        txRequest,
        approveTxRequest,
        revocationTxRequest,
        gasFee,
        gasFeeEstimation,
        swapRequestArgs: swapTxInfo.swapRequestArgs,
        permit,
        unsigned,
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
        swapRequestArgs: swapTxInfo.swapRequestArgs,
        permit,
        unsigned,
      }
    }
  }, [
    swapTxInfo.gasEstimate,
    swapTxInfo.gasFeeResult,
    swapTxInfo.transactionRequest,
    swapTxInfo.permitData,
    swapTxInfo.permitSignature,
    swapTxInfo.swapRequestArgs,
    approvalGasFeeResult,
    revokeGasFeeResult,
    tokenApprovalInfo?.txRequest,
    tokenApprovalInfo?.cancelTxRequest,
    trade,
    indicativeTrade,
  ])
}
