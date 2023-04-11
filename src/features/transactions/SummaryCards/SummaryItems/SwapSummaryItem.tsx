import { TradeType } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { SplitLogo } from 'src/components/CurrencyLogo/SplitLogo'
import { openModal } from 'src/features/modals/modalSlice'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import { useCreateSwapFormState } from 'src/features/transactions/hooks'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
} from 'src/features/transactions/types'

export default function SwapSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & {
    typeInfo: ExactOutputSwapTransactionInfo | ExactInputSwapTransactionInfo
  }
}): JSX.Element {
  const dispatch = useAppDispatch()

  const inputCurrencyInfo = useCurrencyInfo(transaction.typeInfo.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(transaction.typeInfo.outputCurrencyId)

  const caption = useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const [inputAmountRaw, outputAmountRaw] =
      transaction.typeInfo.tradeType === TradeType.EXACT_INPUT
        ? [
            transaction.typeInfo.inputCurrencyAmountRaw,
            transaction.typeInfo.expectedOutputCurrencyAmountRaw,
          ]
        : [
            transaction.typeInfo.expectedInputCurrencyAmountRaw,
            transaction.typeInfo.outputCurrencyAmountRaw,
          ]

    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const currencyAmount = getFormattedCurrencyAmount(inputCurrency, inputAmountRaw)
    const otherCurrencyAmount = getFormattedCurrencyAmount(outputCurrency, outputAmountRaw)
    return `${currencyAmount}${inputCurrency.symbol} → ${otherCurrencyAmount}${outputCurrency.symbol}`
  }, [inputCurrencyInfo, outputCurrencyInfo, transaction.typeInfo])

  // For retrying failed, locally submitted swaps
  const swapFormState = useCreateSwapFormState(
    transaction.from,
    transaction.chainId,
    transaction.id
  )

  const onRetry = useCallback(() => {
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [dispatch, swapFormState])

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={
        <SplitLogo
          inputCurrencyInfo={inputCurrencyInfo}
          outputCurrencyInfo={outputCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
        />
      }
      transaction={transaction}
      onRetry={swapFormState && onRetry}
    />
  )
}
