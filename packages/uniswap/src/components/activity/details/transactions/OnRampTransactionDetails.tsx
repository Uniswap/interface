import { useMemo } from 'react'
import { CurrencyTransferContent } from 'uniswap/src/components/activity/details/transactions/TransferTransactionDetails'
import { isOnRampPurchaseTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

export function OnRampTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: OnRampTransferInfo | OnRampPurchaseInfo
  onClose: () => void
}): JSX.Element {
  const formatter = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.destinationTokenAddress))

  const { amount, value: calculatedValue } = useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw: typeInfo.destinationTokenAmount?.toString(),
    formatter,
    isApproximateAmount: false,
    valueType: ValueType.Exact,
  })

  const transactionValue = useMemo(() => {
    return isOnRampPurchaseTransactionInfo(typeInfo)
      ? formatter.formatNumberOrString({
          value: typeInfo.sourceAmount,
          type: NumberType.FiatTokenPrice,
          currencyCode: typeInfo.sourceCurrency,
        })
      : calculatedValue
  }, [typeInfo, formatter, calculatedValue])

  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)

  const tokenAmountWithSymbol = symbol ? amount + ' ' + symbol : amount // Prevents 'undefined' from being displayed

  return (
    <CurrencyTransferContent
      currencyInfo={currencyInfo}
      showValueAsHeading={typeInfo.type === TransactionType.OnRampPurchase}
      tokenAmountWithSymbol={tokenAmountWithSymbol}
      value={transactionValue}
      onClose={onClose}
    />
  )
}
