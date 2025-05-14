import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import {
  TransactionRequestInfo,
  createProcessSwapResponse,
  getSwapInputExceedsBalance,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction, BridgeTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { tryCatch } from 'utilities/src/errors'

type GetEVMSwapTransactionRequestInfoFn = (params: {
  trade: ClassicTrade | BridgeTrade
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
}) => Promise<TransactionRequestInfo>

export function createGetEVMSwapTransactionRequestInfo(ctx: {
  instructionService: EVMSwapInstructionsService
  activeGasStrategy: GasStrategy
  transactionSettings: TransactionSettingsContextState
}): GetEVMSwapTransactionRequestInfoFn {
  const { activeGasStrategy, transactionSettings, instructionService } = ctx

  const processSwapResponse = createProcessSwapResponse({ activeGasStrategy })

  const getEVMSwapTransactionRequestInfo: GetEVMSwapTransactionRequestInfoFn = async ({
    trade,
    approvalTxInfo,
    derivedSwapInfo,
  }) => {
    const { tokenApprovalInfo } = approvalTxInfo

    const swapQuoteResponse = trade.quote
    const swapQuote = swapQuoteResponse.quote

    const approvalAction = tokenApprovalInfo.action
    const approvalUnknown = approvalAction === ApprovalAction.Unknown

    const skip = getSwapInputExceedsBalance({ derivedSwapInfo }) || approvalUnknown
    const { data, error } = await tryCatch(
      skip
        ? Promise.resolve(undefined)
        : instructionService.getSwapInstructions({ swapQuoteResponse, transactionSettings, approvalAction }),
    )

    const isRevokeNeeded = tokenApprovalInfo.action === ApprovalAction.RevokeAndPermit2Approve
    const swapTxInfo = processSwapResponse({
      response: data?.response ?? undefined,
      error,
      permitData: data?.unsignedPermit,
      swapQuote,
      isSwapLoading: false,
      isRevokeNeeded,
      swapRequestParams: data?.swapRequestParams ?? undefined,
    })

    return swapTxInfo
  }

  return getEVMSwapTransactionRequestInfo
}
