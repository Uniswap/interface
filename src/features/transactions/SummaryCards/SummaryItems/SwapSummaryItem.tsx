import { TradeType } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { SwapLogoOrLogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { Text } from 'src/components/Text'
import { openModal } from 'src/features/modals/modalSlice'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import { useCreateSwapFormState } from 'src/features/transactions/hooks'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionStatus,
} from 'src/features/transactions/types'

export default function SwapSummaryItem({
  transaction,
  showInlineWarning,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: ExactOutputSwapTransactionInfo | ExactInputSwapTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { status } = transaction

  const inputCurrencyInfo = useCurrencyInfo(transaction.typeInfo.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(transaction.typeInfo.outputCurrencyId)

  const showCancelIcon =
    (status === TransactionStatus.Cancelled || status === TransactionStatus.Cancelling) &&
    showInlineWarning

  const [inputAmountRaw, outputAmountRaw] = useMemo(() => {
    if (transaction.typeInfo.tradeType === TradeType.EXACT_INPUT) {
      return [
        transaction.typeInfo.inputCurrencyAmountRaw,
        transaction.typeInfo.expectedOutputCurrencyAmountRaw,
      ]
    } else
      return [
        transaction.typeInfo.expectedInputCurrencyAmountRaw,
        transaction.typeInfo.outputCurrencyAmountRaw,
      ]
  }, [transaction.typeInfo])

  const caption = useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    if (status !== TransactionStatus.Success) {
      const currencyAmount = getFormattedCurrencyAmount(inputCurrency, inputAmountRaw)
      const otherCurrencyAmount = getFormattedCurrencyAmount(outputCurrency, outputAmountRaw)
      return `${currencyAmount}${inputCurrency.symbol} → ${otherCurrencyAmount}${outputCurrency.symbol}`
    }
    return inputCurrency.symbol + '→' + outputCurrency.symbol
  }, [inputAmountRaw, inputCurrencyInfo, outputAmountRaw, outputCurrencyInfo, status])

  const title = getTransactionTitle(transaction.status, t('Swap'), t('Swapped'), t)

  // For retrying failed, locally submitted swaps
  const swapFormState = useCreateSwapFormState(
    transaction.from,
    transaction.chainId,
    transaction.id
  )

  const onRetry = useCallback(() => {
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [dispatch, swapFormState])

  const endAdornment = useMemo(() => {
    if (status === TransactionStatus.Failed) {
      if (swapFormState) {
        return (
          <Text color="accentAction" variant="buttonLabelMedium" onPress={onRetry}>
            {t('Retry')}
          </Text>
        )
      } else return undefined
    }
    if (outputCurrencyInfo) {
      return (
        <BalanceUpdate
          amountRaw={outputAmountRaw}
          currency={outputCurrencyInfo.currency}
          transactedUSDValue={transaction.typeInfo.transactedUSDValue}
          transactionStatus={transaction.status}
          transactionType={transaction.typeInfo.type}
        />
      )
    }
  }, [onRetry, outputAmountRaw, outputCurrencyInfo, status, swapFormState, t, transaction])

  return (
    <TransactionSummaryLayout
      caption={caption}
      endAdornment={endAdornment}
      icon={
        <SwapLogoOrLogoWithTxStatus
          inputCurrencyInfo={inputCurrencyInfo}
          outputCurrencyInfo={outputCurrencyInfo}
          showCancelIcon={showCancelIcon}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={status}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
