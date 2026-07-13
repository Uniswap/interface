import { CurrencyTransferContent } from 'uniswap/src/components/activity/details/transactions/TransferTransactionDetails'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { getDepositWithdrawDisplayCurrencyId } from 'uniswap/src/features/activity/utils/getDepositWithdrawDisplayCurrencyId'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  DepositTransactionInfo,
  TransactionDetails,
  WithdrawTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

export function VaultTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: DepositTransactionInfo | WithdrawTransactionInfo
  onClose: () => void
}): JSX.Element {
  const formatter = useLocalizationContext()
  const currencyId = getDepositWithdrawDisplayCurrencyId({ chainId: transactionDetails.chainId, typeInfo })
  const currencyInfo = useCurrencyInfo(currencyId)
  const currencyAmountRaw = typeInfo.currencyAmountRaw ?? ''

  const { amount, value, isLoading } = useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw,
    formatter,
    isApproximateAmount: false,
  })
  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)
  const tokenAmountWithSymbol = currencyAmountRaw ? (symbol ? `${amount} ${symbol}` : amount) : undefined

  return (
    <CurrencyTransferContent
      currencyInfo={currencyInfo}
      isLoading={isLoading}
      tokenAmountWithSymbol={tokenAmountWithSymbol}
      value={value}
      onClose={onClose}
    />
  )
}
