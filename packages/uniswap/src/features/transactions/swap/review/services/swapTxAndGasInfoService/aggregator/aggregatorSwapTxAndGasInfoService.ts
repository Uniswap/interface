import { BigNumber, providers } from 'ethers/lib/ethers'
import { ClassicQuote } from 'uniswap/src/data/tradingApi/__generated__/index'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/contexts/hooks/useTokenApprovalInfo'
import { EVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { createGetEVMSwapTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/utils'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import {
  TransactionRequestInfo,
  createGetPermitTxInfo,
  getAggregatorSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { AggregatorTrade, ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { encodeERC20ApproveCalldata, parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import { isSameAddress } from 'utilities/src/addresses'

function getFallbackGasFeeValue({
  quote,
  activeGasStrategy,
}: {
  quote: ClassicQuote
  activeGasStrategy: GasStrategy
}): string {
  const gasUseEstimate = quote.gasUseEstimate
  const gasPrice = quote.maxFeePerGas ?? quote.gasPrice
  if (!gasUseEstimate || !gasPrice) {
    return '0'
  }

  const PRECISION = 1_000_000
  const scaledLimitFactor = Math.round(activeGasStrategy.limitInflationFactor * PRECISION)
  return BigNumber.from(gasUseEstimate)
    .mul(BigNumber.from(gasPrice))
    .mul(BigNumber.from(scaledLimitFactor))
    .div(BigNumber.from(PRECISION))
    .toString()
}

/**
 * Build ERC20 approve transaction request for aggregator swap.
 * The spender is the swap contract (methodParameters.to) that will pull the input token.
 */
function buildAggregatorApproveTxRequest(
  trade: AggregatorTrade,
  spender: string,
  chainId: number,
): providers.TransactionRequest | undefined {
  const currency = trade.inputAmount.currency
  if (currency.isNative) {
    return undefined
  }
  const tokenAddress = currency.wrapped.address
  const amount = BigInt(trade.inputAmount.quotient.toString())
  return {
    to: tokenAddress,
    data: encodeERC20ApproveCalldata(spender, amount),
    value: '0x0',
    chainId,
  }
}

/**
 * Build transaction request info directly from AGT_ENSO quote's methodParameters
 * This is used when the backend returns the transaction data directly in the quote
 */
function buildAggregatorSwapTxInfoFromQuote(ctx: {
  trade: AggregatorTrade
  approvalTxInfo: ApprovalTxInfo
  derivedSwapInfo: DerivedSwapInfo
  activeGasStrategy: GasStrategy
}): TransactionRequestInfo {
  const { trade, activeGasStrategy } = ctx
  const quote = trade.quote.quote
  const methodParameters = quote.methodParameters

  // Build transaction request from methodParameters
  const txRequest: providers.TransactionRequest | undefined = methodParameters
    ? {
        to: methodParameters.to,
        data: methodParameters.calldata,
        value: methodParameters.value,
        chainId: quote.chainId,
      }
    : undefined

  const gasFeeValue = quote.gasFee ?? getFallbackGasFeeValue({ quote, activeGasStrategy })
  const swapGasFee = {
    value: gasFeeValue,
    displayValue: convertGasFeeToDisplayValue(gasFeeValue, activeGasStrategy),
  }

  return {
    txRequests: txRequest ? [txRequest] : undefined,
    permitData: undefined,
    gasFeeResult: {
      value: swapGasFee.value,
      displayValue: swapGasFee.displayValue,
      isLoading: false,
      error: txRequest ? null : new Error('Missing methodParameters in AGT_ENSO quote'),
    },
    gasEstimate: {},
    swapRequestArgs: undefined,
    includesDelegation: false,
  }
}

export function createAggregatorSwapTxAndGasInfoService(ctx: {
  instructionService: EVMSwapInstructionsService
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  transactionSettings: TransactionSettingsContextState
  v4SwapEnabled: boolean
}): SwapTxAndGasInfoService<AggregatorTrade> {
  const getEVMSwapTransactionRequestInfo = createGetEVMSwapTransactionRequestInfo(ctx)
  const getPermitTxInfo = createGetPermitTxInfo({ activeGasStrategy: ctx.activeGasStrategy })

  const service: SwapTxAndGasInfoService<AggregatorTrade> = {
    async getSwapTxAndGasInfo(params) {
      // console.log('aggregatorSwapTxAndGasInfoService.getSwapTxAndGasInfo called with params:', params)

      const quote = params.trade.quote.quote
      const permitTxInfo = getPermitTxInfo({ quote: params.trade.quote })

      // Check if methodParameters is available in the quote (direct transaction data from backend)
      if (quote.methodParameters?.to && quote.methodParameters?.calldata) {
        // console.log('aggregatorSwapTxAndGasInfoService: Using methodParameters from quote directly')
        const swapTxInfo = buildAggregatorSwapTxInfoFromQuote({
          ...params,
          activeGasStrategy: ctx.activeGasStrategy,
        })
        const spender = quote.methodParameters.to
        const { tokenApprovalInfo } = params.approvalTxInfo

        // Reuse check_approval result: if already approved (None), do not add approve step
        if (tokenApprovalInfo.action === ApprovalAction.None) {
          return getAggregatorSwapTxAndGasInfo({
            ...params,
            swapTxInfo,
            permitTxInfo,
          })
        }

        // Approval needed: use API tx if it targets our spender (check_approval with spender), else build our own
        const existingTxRequest = tokenApprovalInfo.txRequest
        const existingSpenderMatches =
          existingTxRequest?.data &&
          ((): boolean => {
            try {
              const { spender: existingSpender } = parseERC20ApproveCalldata(
                typeof existingTxRequest.data === 'string' ? existingTxRequest.data : existingTxRequest.data.toString(),
              )
              return isSameAddress(existingSpender, spender)
            } catch {
              return false
            }
          })()

        const chainId = quote.chainId ?? params.trade.inputAmount.currency.chainId
        const aggregatorApproveTxRequest =
          existingSpenderMatches && existingTxRequest
            ? existingTxRequest
            : buildAggregatorApproveTxRequest(params.trade, spender, chainId)

        const isRevokeAndApprove = tokenApprovalInfo.action === ApprovalAction.RevokeAndPermit2Approve
        const approvalTxInfoForAggregator: ApprovalTxInfo =
          aggregatorApproveTxRequest != null
            ? {
                ...params.approvalTxInfo,
                tokenApprovalInfo:
                  isRevokeAndApprove && tokenApprovalInfo.cancelTxRequest != null
                    ? {
                        action: ApprovalAction.RevokeAndPermit2Approve,
                        txRequest: aggregatorApproveTxRequest,
                        cancelTxRequest: tokenApprovalInfo.cancelTxRequest,
                      }
                    : {
                        action: ApprovalAction.Permit2Approve,
                        txRequest: aggregatorApproveTxRequest,
                        cancelTxRequest: null,
                      },
              }
            : params.approvalTxInfo

        return getAggregatorSwapTxAndGasInfo({
          ...params,
          swapTxInfo,
          permitTxInfo,
          approvalTxInfo: approvalTxInfoForAggregator,
        })
      }

      // Fallback to calling /swap endpoint if methodParameters is not available
      // console.log('aggregatorSwapTxAndGasInfoService: methodParameters not in quote, calling /swap endpoint')
      const swapTxInfo = await getEVMSwapTransactionRequestInfo(params)
      // console.log('aggregatorSwapTxAndGasInfoService.getSwapTxAndGasInfo swapTxInfo (from /swap):', swapTxInfo)
      return getAggregatorSwapTxAndGasInfo({ ...params, swapTxInfo, permitTxInfo })
    },
  }

  return service
}
