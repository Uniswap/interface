import { useMemo } from 'react'
import { BridgeIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { BridgeTransactionInfo, TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'
import { TransactionSummaryLayout } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE, useOnRetrySwap } from 'wallet/src/features/transactions/SummaryCards/utils'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'
import { BridgingCurrencyRow } from 'wallet/src/features/transactions/swap/BridgingCurrencyRow'

export function BridgeSummaryItem({
  transaction,
  swapCallbacks,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: BridgeTransactionInfo
  }
}): JSX.Element {
  const { typeInfo } = transaction
  const inputCurrencyInfo = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(typeInfo.outputCurrencyId)
  const formatter = useLocalizationContext()
  const onRetry = useOnRetrySwap(transaction, swapCallbacks)

  const caption = useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const inputCurrencyAmount = getFormattedCurrencyAmount(inputCurrency, inputCurrencyAmountRaw, formatter)
    const outputCurrencyAmount = getFormattedCurrencyAmount(outputCurrency, outputCurrencyAmountRaw, formatter)

    return (
      <BridgingCurrencyRow
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        formattedInputTokenAmount={inputCurrencyAmount}
        formattedOutputTokenAmount={outputCurrencyAmount}
      />
    )
  }, [inputCurrencyInfo, outputCurrencyInfo, formatter, typeInfo])

  const icon = useMemo(
    () => (
      <SplitLogo
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        chainId={transaction.chainId}
        customIcon={BridgeIcon}
      />
    ),
    [inputCurrencyInfo, outputCurrencyInfo, transaction.chainId],
  )

  return (
    <TransactionSummaryLayout caption={caption} icon={icon} index={index} transaction={transaction} onRetry={onRetry} />
  )
}
