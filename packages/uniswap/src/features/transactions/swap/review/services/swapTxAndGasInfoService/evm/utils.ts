import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { EVMSwapRepository } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import {
  TransactionRequestInfo,
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getShouldSkipSwapRequest,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction, BridgeTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { tryCatch } from 'utilities/src/errors'

type GetEVMSwapTransactionRequestInfoFn = (params: {
  trade: ClassicTrade | BridgeTrade
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
  signature?: string
}) => Promise<TransactionRequestInfo>

export function createGetEVMSwapTransactionRequestInfo(ctx: {
  swapRepository: EVMSwapRepository
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  transactionSettings: TransactionSettingsContextState
  v4SwapEnabled: boolean
}): GetEVMSwapTransactionRequestInfoFn {
  const { activeGasStrategy, shadowGasStrategies, v4SwapEnabled, transactionSettings, swapRepository } = ctx

  const prepareSwapRequestParams = createPrepareSwapRequestParams({
    activeGasStrategy,
    shadowGasStrategies,
    v4SwapEnabled,
  })
  const processSwapResponse = createProcessSwapResponse({ activeGasStrategy })

  const getEVMSwapTransactionRequestInfo: GetEVMSwapTransactionRequestInfoFn = async ({
    trade,
    approvalTxInfo,
    derivedSwapInfo,
    signature,
  }) => {
    const { tokenApprovalInfo } = approvalTxInfo
    const permitData = trade?.quote?.permitData

    const swapQuoteResponse = trade.quote
    const swapQuote = swapQuoteResponse.quote

    const alreadyApproved = tokenApprovalInfo.action === ApprovalAction.None

    const params = prepareSwapRequestParams({ swapQuoteResponse, signature, transactionSettings, alreadyApproved })
    const skip = getShouldSkipSwapRequest({ derivedSwapInfo, tokenApprovalInfo, signature })
    const { data, error } = await tryCatch(skip ? Promise.resolve(undefined) : swapRepository.fetchSwapData(params))

    const isRevokeNeeded = tokenApprovalInfo.action === ApprovalAction.RevokeAndPermit2Approve
    const swapTxInfo = processSwapResponse({
      response: data ?? undefined,
      error,
      permitData,
      swapQuote,
      isSwapLoading: false,
      isRevokeNeeded,
      swapRequestParams: params,
    })

    return swapTxInfo
  }

  return getEVMSwapTransactionRequestInfo
}
