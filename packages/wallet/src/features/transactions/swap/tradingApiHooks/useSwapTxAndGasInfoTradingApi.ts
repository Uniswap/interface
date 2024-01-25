import { providers } from 'ethers'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { ApprovalAction } from 'wallet/src/features/transactions/swap/hooks'
import { useTokenApprovalInfo } from 'wallet/src/features/transactions/swap/tradingApiHooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'wallet/src/features/transactions/swap/tradingApiHooks/useTransactionRequestInfo'
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
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo({
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    skip: derivedSwapInfo?.trade.trade?.quoteData?.quoteType === QuoteType.RoutingApi,
  })

  const transactionRequestInfo = useTransactionRequestInfo({
    derivedSwapInfo,
    // Dont send transaction request if invalid or missing approval data
    skip: !tokenApprovalInfo?.action || tokenApprovalInfo.action === ApprovalAction.Unknown,
  })

  const totalGasFee = sumGasFees(
    tokenApprovalInfo?.gasFee,
    transactionRequestInfo?.gasFeeResult.value
  )

  const gasFeeResult = {
    value: totalGasFee,
    loading: !tokenApprovalInfo || transactionRequestInfo.gasFeeResult.loading,
  }

  return {
    txRequest: transactionRequestInfo.transactionRequest,
    approveTxRequest: tokenApprovalInfo?.txRequest || undefined,
    approvalError: tokenApprovalInfo?.action === ApprovalAction.Unknown,
    gasFee: gasFeeResult,
  }
}
