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

    if (process.env.NODE_ENV === 'development') {
      console.log('[execute] createGetEVMSwapTransactionRequestInfo - Before getSwapInstructions:', {
        skip,
        approvalAction,
        approvalUnknown,
        inputExceedsBalance: getSwapInputExceedsBalance({ derivedSwapInfo }),
        hasInstructionService: !!instructionService,
      })
    }

    // Always prepare swapRequestParams, even if skip is true, so deadline is preserved
    const alreadyApproved = approvalAction === ApprovalAction.None && !swapQuoteResponse.permitTransaction
    const swapRequestParams = prepareSwapRequestParams({
      swapQuoteResponse,
      signature: undefined,
      transactionSettings,
      alreadyApproved,
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[execute] createGetEVMSwapTransactionRequestInfo - Prepared swapRequestParams:', {
        deadline: swapRequestParams.deadline,
        deadlineDate: swapRequestParams.deadline ? new Date(swapRequestParams.deadline * 1000).toLocaleString('zh-CN') : undefined,
        hasQuote: !!swapRequestParams.quote,
        simulateTransaction: swapRequestParams.simulateTransaction,
      })
    }

    const { data, error } = await tryCatch(
      skip
        ? Promise.resolve(undefined)
        : instructionService.getSwapInstructions({ swapQuoteResponse, transactionSettings, approvalAction }),
    )

    if (process.env.NODE_ENV === 'development') {
      console.log('[execute] createGetEVMSwapTransactionRequestInfo - After getSwapInstructions:', {
        hasData: !!data,
        data: data ? {
          hasResponse: !!data.response,
          hasUnsignedPermit: !!data.unsignedPermit,
          hasSwapRequestParams: !!data.swapRequestParams,
          swapRequestParams: data.swapRequestParams ? {
            deadline: data.swapRequestParams.deadline,
            deadlineDate: data.swapRequestParams.deadline ? new Date(data.swapRequestParams.deadline * 1000).toLocaleString('zh-CN') : undefined,
            hasQuote: !!data.swapRequestParams.quote,
            simulateTransaction: data.swapRequestParams.simulateTransaction,
          } : 'swapRequestParams is undefined',
        } : 'data is undefined',
        hasError: !!error,
        error: error?.message,
      })
    }

    const isRevokeNeeded = tokenApprovalInfo.action === ApprovalAction.RevokeAndPermit2Approve
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[execute] createGetEVMSwapTransactionRequestInfo - Before processSwapResponse:', {
        hasResponse: !!data?.response,
        hasSwapRequestParams: !!data?.swapRequestParams,
        swapRequestParams: data?.swapRequestParams ? {
          deadline: data.swapRequestParams.deadline,
          deadlineDate: data.swapRequestParams.deadline ? new Date(data.swapRequestParams.deadline * 1000).toLocaleString('zh-CN') : undefined,
          hasQuote: !!data.swapRequestParams.quote,
          simulateTransaction: data.swapRequestParams.simulateTransaction,
        } : 'swapRequestParams is undefined',
        hasUnsignedPermit: !!data?.unsignedPermit,
      })
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log('[execute] createGetEVMSwapTransactionRequestInfo - After processSwapResponse:', {
        hasSwapRequestArgs: !!swapTxInfo.swapRequestArgs,
        swapRequestArgs: swapTxInfo.swapRequestArgs ? {
          deadline: swapTxInfo.swapRequestArgs.deadline,
          deadlineDate: swapTxInfo.swapRequestArgs.deadline ? new Date(swapTxInfo.swapRequestArgs.deadline * 1000).toLocaleString('zh-CN') : undefined,
          hasQuote: !!swapTxInfo.swapRequestArgs.quote,
          simulateTransaction: swapTxInfo.swapRequestArgs.simulateTransaction,
        } : 'swapRequestArgs is undefined',
      })
    }

    return swapTxInfo
  }

  return getEVMSwapTransactionRequestInfo
}
