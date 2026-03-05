import { memo, useMemo } from 'react'
import { useOnRetrySwap } from 'uniswap/src/components/activity/hooks/useOnRetrySwap'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import type { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { CrossChainIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CrossChainCurrencyRow } from 'uniswap/src/features/transactions/swap/components/CrossChainCurrencyRow'
import {
  type PlanTransactionInfo,
  type TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'

/**
 * Component used in the activity history to display the top level details of a plan transaction.
 * @param param0
 * @returns
 */
function _PlanSummaryItem({
  transaction,
  swapCallbacks,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: PlanTransactionInfo
  }
}): JSX.Element {
  const { typeInfo, status } = transaction
  const { inputCurrencyId, outputCurrencyId, inputCurrencyAmountRaw, outputCurrencyAmountRaw } = typeInfo
  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)
  const formatter = useLocalizationContext()
  const onRetry = useOnRetrySwap(transaction, swapCallbacks)

  const caption = useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const currencyAmount = getFormattedCurrencyAmount({
      currency: inputCurrency,
      amount: inputCurrencyAmountRaw,
      formatter,
      isApproximateAmount: false,
    })

    const isApproximateAmount = status !== TransactionStatus.Success
    const otherCurrencyAmount = getFormattedCurrencyAmount({
      currency: outputCurrency,
      amount: outputCurrencyAmountRaw,
      formatter,
      isApproximateAmount,
    })
    return (
      <CrossChainCurrencyRow
        inputChainId={inputCurrency.chainId}
        inputSymbol={inputCurrency.symbol ?? ''}
        outputChainId={outputCurrency.chainId}
        outputSymbol={outputCurrency.symbol ?? ''}
        formattedInputTokenAmount={currencyAmount}
        formattedOutputTokenAmount={otherCurrencyAmount}
      />
    )
  }, [inputCurrencyInfo, outputCurrencyInfo, formatter, inputCurrencyAmountRaw, outputCurrencyAmountRaw, status])

  const icon = useMemo(
    () => (
      <SplitLogo
        chainId={transaction.chainId}
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        customIcon={<CrossChainIcon status={status} />}
      />
    ),
    [inputCurrencyInfo, outputCurrencyInfo, transaction.chainId, status],
  )

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={icon}
      index={index}
      transaction={transaction}
      isExternalProfile={isExternalProfile}
      onRetry={onRetry}
    />
  )
}

export const PlanSummaryItem = memo(_PlanSummaryItem)
