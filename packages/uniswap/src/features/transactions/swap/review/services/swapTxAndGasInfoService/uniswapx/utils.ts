import { NullablePermit } from 'uniswap/src/data/tradingApi/__generated__'
import { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import {
  TransactionRequestInfo,
  createApprovalFields,
  createGasFields,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  UniswapXGasBreakdown,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'

// TODO(WEB-7432): Remove deprecated UniswapX Wrap logic
export function processUniswapXResponse({
  wrapTransactionRequestInfo,
  permitData,
  needsWrap,
}: {
  wrapTransactionRequestInfo?: TransactionRequestInfo
  permitData: NullablePermit | undefined
  needsWrap?: boolean
}): TransactionRequestInfo {
  if (needsWrap && wrapTransactionRequestInfo) {
    return {
      ...wrapTransactionRequestInfo, // Extend the wrap response if a wrap is needed
      permitData,
    }
  }

  return {
    gasFeeResult: { value: '0', displayValue: '0', error: null, isLoading: false }, // Set a 0 gas fee when no wrap is needed
    gasEstimate: {},
    transactionRequest: undefined,
    swapRequestArgs: undefined,
    permitData,
  }
}

function createUniswapXGasBreakdown({
  trade,
  approvalTxInfo,
  swapTxInfo,
}: {
  trade: UniswapXTrade
  approvalTxInfo: ApprovalTxInfo
  swapTxInfo: TransactionRequestInfo
}): { gasFeeBreakdown: UniswapXGasBreakdown } {
  const { approvalGasFeeResult } = approvalTxInfo
  const gasFeeBreakdown = {
    classicGasUseEstimateUSD: trade.quote.quote.classicGasUseEstimateUSD,
    approvalCost: approvalGasFeeResult?.displayValue,
    wrapCost: swapTxInfo.gasFeeResult.displayValue,
    inputTokenSymbol: trade.inputAmount.currency.wrapped.symbol,
  }

  return { gasFeeBreakdown }
}

export function getUniswapXSwapTxAndGasInfo({
  trade,
  swapTxInfo,
  approvalTxInfo,
}: {
  trade: UniswapXTrade
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
}): UniswapXSwapTxAndGasInfo {
  const txRequest = validateTransactionRequest(swapTxInfo.transactionRequest)
  const permit = validatePermit(swapTxInfo.permitData)

  return {
    routing: trade.routing,
    trade,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    ...createUniswapXGasBreakdown({ trade, approvalTxInfo, swapTxInfo }),
    wrapTxRequest: txRequest,
    permit,
  }
}
