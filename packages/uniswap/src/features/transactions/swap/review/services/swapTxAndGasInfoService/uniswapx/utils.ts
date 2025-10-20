import { TradingApi } from '@universe/api'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import type { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  createApprovalFields,
  createGasFields,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type {
  UniswapXGasBreakdown,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { validatePermit } from 'uniswap/src/features/transactions/swap/utils/trade'

export function processUniswapXResponse({
  permitData,
}: {
  permitData: TradingApi.NullablePermit | undefined
}): TransactionRequestInfo {
  return {
    gasFeeResult: { value: '0', displayValue: '0', error: null, isLoading: false }, // There is no gas fee for UniswapX swap
    gasEstimate: {},
    txRequests: undefined,
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
    approvalCost: approvalGasFeeResult.displayValue,
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
  const permit = validatePermit(swapTxInfo.permitData)

  return {
    routing: trade.routing,
    trade,
    ...createGasFields({ swapTxInfo, approvalTxInfo }),
    ...createApprovalFields({ approvalTxInfo }),
    ...createUniswapXGasBreakdown({ trade, approvalTxInfo, swapTxInfo }),
    permit: permit ? { method: PermitMethod.TypedData, typedData: permit } : undefined,
  }
}
