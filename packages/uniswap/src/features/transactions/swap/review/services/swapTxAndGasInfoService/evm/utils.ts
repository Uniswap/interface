import type { GasStrategy } from '@universe/api'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import type { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import type { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getSwapInputExceedsBalance,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type {
  BridgeTrade,
  ClassicTrade,
  UnwrapTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { tryCatch } from 'utilities/src/errors'

type GetEVMSwapTransactionRequestInfoFn = (params: {
  trade: ClassicTrade | BridgeTrade | WrapTrade | UnwrapTrade
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
}) => Promise<TransactionRequestInfo>

export function createGetEVMSwapTransactionRequestInfo(ctx: {
  instructionService: EVMSwapInstructionsService
  gasStrategy: GasStrategy
  transactionSettings: TransactionSettings
}): GetEVMSwapTransactionRequestInfoFn {
  const { gasStrategy, transactionSettings, instructionService } = ctx

  const processSwapResponse = createProcessSwapResponse({ gasStrategy })
  const prepareSwapRequestParams = createPrepareSwapRequestParams({ gasStrategy })

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

    // Always prepare swapRequestParams, even if skip is true, so deadline is preserved
    const alreadyApproved = approvalAction === ApprovalAction.None && !swapQuoteResponse.permitTransaction
    const swapRequestParams = prepareSwapRequestParams({
      swapQuoteResponse,
      signature: undefined,
      transactionSettings,
      alreadyApproved,
    })

    const { data, error } = await tryCatch(
      skip
        ? Promise.resolve(undefined)
        : instructionService.getSwapInstructions({ swapQuoteResponse, transactionSettings, approvalAction }),
    )

    const isRevokeNeeded = tokenApprovalInfo.action === ApprovalAction.RevokeAndPermit2Approve

    // Use swapRequestParams from data if available, otherwise use the one we prepared
    const finalSwapRequestParams = data?.swapRequestParams ?? swapRequestParams

    const swapTxInfo = processSwapResponse({
      response: data?.response ?? undefined,
      error,
      permitData: data?.unsignedPermit,
      swapQuote,
      trade,
      isSwapLoading: false,
      isRevokeNeeded,
      swapRequestParams: finalSwapRequestParams,
    })

    return swapTxInfo
  }

  return getEVMSwapTransactionRequestInfo
}
