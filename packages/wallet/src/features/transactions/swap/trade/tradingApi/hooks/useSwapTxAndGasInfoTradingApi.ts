import { providers } from 'ethers'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useTokenApprovalInfo } from 'wallet/src/features/transactions/swap/trade/tradingApi/hooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'wallet/src/features/transactions/swap/trade/tradingApi/hooks/useTransactionRequestInfo'
import { ApprovalAction } from 'wallet/src/features/transactions/swap/trade/types'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { sumGasFees } from 'wallet/src/features/transactions/swap/utils'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'

interface SwapTxAndGasInfo {
  txRequest?: providers.TransactionRequest
  approveTxRequest?: providers.TransactionRequest
  approvalError?: boolean // block UI if unable to get approval status
  gasFee: GasFeeResult
}

export function useSwapTxAndGasInfoTradingApi({
  derivedSwapInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
}): SwapTxAndGasInfo {
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
    // TODO: MOB-2773 https://linear.app/uniswap/issue/MOB-2773/deprecate-legacy-routing
    skip: trade?.quoteData?.quoteType === QuoteType.RoutingApi,
  })

  const transactionRequestInfo = useTransactionRequestInfo({
    derivedSwapInfo,
    // Dont send transaction request if invalid or missing approval data
    skip: !tokenApprovalInfo?.action || tokenApprovalInfo.action === ApprovalAction.Unknown,
  })

  const approvalError = tokenApprovalInfo?.action === ApprovalAction.Unknown
  const gasFeeError = transactionRequestInfo.gasFeeResult.error || approvalError

  // Dont populate gas fee if errors exist on swap or approval requests
  const totalGasFee = gasFeeError
    ? undefined
    : sumGasFees(tokenApprovalInfo?.gasFee, transactionRequestInfo?.gasFeeResult.value)

  const gasFeeResult = {
    value: totalGasFee,
    loading: !tokenApprovalInfo || transactionRequestInfo.gasFeeResult.loading,
    error: gasFeeError,
  }

  return {
    txRequest: transactionRequestInfo.transactionRequest,
    approveTxRequest: tokenApprovalInfo?.txRequest || undefined,
    approvalError,
    gasFee: gasFeeResult,
  }
}
