import { providers } from 'ethers'
import { useMemo } from 'react'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { OrderRequest, Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useTokenApprovalInfo } from 'wallet/src/features/transactions/swap/trade/api/hooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'wallet/src/features/transactions/swap/trade/api/hooks/useTransactionRequestInfo'
import { ApprovalAction, ClassicTrade, UniswapXTrade } from 'wallet/src/features/transactions/swap/trade/types'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { sumGasFees } from 'wallet/src/features/transactions/swap/utils'

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo

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
  approvalError: boolean
}

type ValidatedTransactionRequest = providers.TransactionRequest & { to: string; chainId: number }
function validateTransactionRequest(
  request?: providers.TransactionRequest | null,
): ValidatedTransactionRequest | undefined {
  if (request?.to && request.chainId) {
    return { ...request, to: request.to, chainId: request.chainId }
  }
  return undefined
}

export function useSwapTxAndGasInfo({ derivedSwapInfo }: { derivedSwapInfo: DerivedSwapInfo }): SwapTxAndGasInfo {
  const {
    chainId,
    wrapType,
    currencyAmounts,
    trade: { trade },
  } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo({
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    routing: trade?.routing,
  })

  // TODO(MOB-3425) decouple wrap tx from swap tx to simplify UniswapX code
  const swapTxInfo = useTransactionRequestInfo({
    derivedSwapInfo,
    // Dont send transaction request if invalid or missing approval data
    skip: !tokenApprovalInfo?.action || tokenApprovalInfo.action === ApprovalAction.Unknown,
    tokenApprovalInfo,
  })

  const approvalError = tokenApprovalInfo?.action === ApprovalAction.Unknown
  const gasFeeError = swapTxInfo.gasFeeResult.error || approvalError

  // For UniswapX, do not expect a swap gas fee unless a wrap is involved
  const isWraplessUniswapXTrade = trade && isUniswapX(trade) && !trade.needsWrap
  const areValuesReady = tokenApprovalInfo && (isWraplessUniswapXTrade || swapTxInfo.gasFeeResult.value !== undefined)

  return useMemo(() => {
    // Do not populate gas fee:
    //   - If errors exist on swap or approval requests.
    //   - If we don't have both the approval and transaction gas fees.
    const totalGasFee =
      gasFeeError || !areValuesReady ? undefined : sumGasFees(tokenApprovalInfo?.gasFee, swapTxInfo?.gasFeeResult.value)

    const isGasless = isWraplessUniswapXTrade && tokenApprovalInfo?.action === ApprovalAction.None

    const gasFee = {
      value: isGasless ? '0' : totalGasFee,
      loading: !tokenApprovalInfo || swapTxInfo.gasFeeResult.loading,
      error: gasFeeError,
    }

    const approveTxRequest = validateTransactionRequest(tokenApprovalInfo?.txRequest)

    if (trade?.routing === Routing.DUTCH_V2) {
      const signature = swapTxInfo.permitSignature
      const orderParams = signature ? { signature, quote: trade.quote.quote, routing: Routing.DUTCH_V2 } : undefined

      return {
        routing: Routing.DUTCH_V2,
        trade,
        wrapTxRequest: validateTransactionRequest(swapTxInfo.transactionRequest),
        approveTxRequest,
        orderParams,
        gasFee,
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
    isWraplessUniswapXTrade,
    gasFeeError,
    areValuesReady,
    tokenApprovalInfo,
    swapTxInfo.gasFeeResult.value,
    swapTxInfo.gasFeeResult.loading,
    swapTxInfo.permitSignature,
    swapTxInfo.transactionRequest,
    trade,
    approvalError,
  ])
}
