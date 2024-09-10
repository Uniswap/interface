import { providers } from 'ethers'
import { useMemo } from 'react'
import { OrderRequest, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { ApprovalAction, ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useTokenApprovalInfo } from 'wallet/src/features/transactions/swap/trade/api/hooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'wallet/src/features/transactions/swap/trade/api/hooks/useTransactionRequestInfo'
import { sumGasFees } from 'wallet/src/features/transactions/swap/utils'

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo

export type UniswapXGasBreakdown = {
  classicGasUseEstimateUSD?: string
  approvalCost?: string
  wrapCost?: string
  inputTokenSymbol?: string
}

export type ClassicSwapTxAndGasInfo = {
  routing: Routing.CLASSIC
  trade?: ClassicTrade
  txRequest?: ValidatedTransactionRequest
  approveTxRequest: ValidatedTransactionRequest | undefined
  gasFee: GasFeeResult
  approvalError: boolean
}

export type UniswapXSwapTxAndGasInfo = {
  routing: Routing.DUTCH_V2
  trade: UniswapXTrade
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
    trade: { trade },
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

  // For UniswapX, do not expect a swap gas fee unless a wrap is involved
  const isWraplessUniswapXTrade = trade && isUniswapX(trade) && !trade.needsWrap
  const areValuesReady = tokenApprovalInfo && (isWraplessUniswapXTrade || swapTxInfo.gasFeeResult.value !== undefined)

  return useMemo(() => {
    const approvalError = tokenApprovalInfo?.action === ApprovalAction.Unknown
    const gasFeeError = swapTxInfo.gasFeeResult.error ?? approvalError ? new Error('Approval action unknown') : null

    // Do not populate gas fee:
    //   - If errors exist on swap or approval requests.
    //   - If we don't have both the approval and transaction gas fees.
    const totalGasFee =
      gasFeeError || !areValuesReady ? undefined : sumGasFees(tokenApprovalInfo?.gasFee, swapTxInfo?.gasFeeResult.value)

    const isGasless = isWraplessUniswapXTrade && tokenApprovalInfo?.action === ApprovalAction.None

    const gasFee = {
      value: isGasless ? '0' : totalGasFee,
      isLoading: !tokenApprovalInfo || swapTxInfo.gasFeeResult.isLoading,
      error: gasFeeError,
    }

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
        txRequest: validateTransactionRequest(swapTxInfo.transactionRequest),
        approveTxRequest,
        gasFee,
        approvalError,
      }
    }
  }, [
    tokenApprovalInfo,
    swapTxInfo.gasFeeResult.error,
    swapTxInfo.gasFeeResult.value,
    swapTxInfo.gasFeeResult.isLoading,
    swapTxInfo.permitSignature,
    swapTxInfo.transactionRequest,
    areValuesReady,
    isWraplessUniswapXTrade,
    trade,
  ])
}
