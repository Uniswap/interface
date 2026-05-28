import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  OffRampSaleInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { CurrencyTransferContent } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransferTransactionDetails'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'

export function OffRampTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: OffRampSaleInfo
  onClose: () => void
}): JSX.Element {
  const formatter = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.destinationTokenAddress))

  const { amount, value } = useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw: typeInfo.sourceAmount?.toString(),
    formatter,
    isApproximateAmount: false,
    valueType: ValueType.Exact,
  })
  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)

  const tokenAmountWithSymbol = symbol ? amount + ' ' + symbol : amount // Prevents 'undefined' from being displayed

  return (
    <CurrencyTransferContent
      currencyInfo={currencyInfo}
      showValueAsHeading={typeInfo.type === TransactionType.OffRampSale}
      tokenAmountWithSymbol={tokenAmountWithSymbol}
      value={value}
      onClose={onClose}
    />
  )
}
