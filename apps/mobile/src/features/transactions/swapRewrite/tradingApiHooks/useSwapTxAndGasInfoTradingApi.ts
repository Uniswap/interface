import { providers } from 'ethers'
import { ApprovalAction } from 'src/features/transactions/swap/hooks'
import { DerivedSwapInfo } from 'src/features/transactions/swap/types'
import { sumGasFees } from 'src/features/transactions/swap/utils'
import { useTokenApprovalInfo } from 'src/features/transactions/swapRewrite/tradingApiHooks/useTokenApprovalInfo'
import { useTransactionRequestInfo } from 'src/features/transactions/swapRewrite/tradingApiHooks/useTransactionRequestInfo'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { isClassicQuote } from 'wallet/src/features/transactions/swap/tradingApi/utils'
import { QuoteType } from 'wallet/src/features/transactions/swap/useTrade'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

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
  const { chainId, wrapType, currencyAmounts, trade } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo({
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    skip: derivedSwapInfo?.trade.trade?.quoteData?.quoteType === QuoteType.RoutingApi,
  })

  const transactionRequestInfo = useTransactionRequestInfo(derivedSwapInfo)

  // TODO:api - enforce trading api quote type, remove when we remove legacy routing.
  const quote =
    trade.trade?.quoteData?.quoteType === QuoteType.TradingApi
      ? trade.trade.quoteData.quote
      : undefined

  // TODO: MOB(2438) https://linear.app/uniswap/issue/MOB-2438/uniswap-x-clean-old-trading-api-code
  const classicQuote = isClassicQuote(quote?.quote) ? quote?.quote : undefined

  const totalGasFee = sumGasFees(tokenApprovalInfo?.gasFee, classicQuote?.gasFee)

  const gasFeeResult = {
    value: totalGasFee,
    loading: !tokenApprovalInfo || !transactionRequestInfo,
  }

  return {
    txRequest: transactionRequestInfo.transactionRequest,
    approveTxRequest: tokenApprovalInfo?.txRequest || undefined,
    approvalError: tokenApprovalInfo?.action === ApprovalAction.Unknown,
    gasFee: gasFeeResult,
  }
}
