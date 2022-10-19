import { TradeType } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { SwapLogoOrLogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { Text } from 'src/components/Text'
import { openModal } from 'src/features/modals/modalSlice'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useCreateSwapFormState } from 'src/features/transactions/hooks'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { formatTitleWithStatus } from 'src/features/transactions/SummaryCards/utils'
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
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  let { status } = transaction

  const inputCurrency = useCurrency(transaction.typeInfo.inputCurrencyId)
  const outputCurrency = useCurrency(transaction.typeInfo.outputCurrencyId)

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
    if (!inputCurrency || !outputCurrency) {
      return ''
    }
    if (status !== TransactionStatus.Success) {
      const currencyAmount = getFormattedCurrencyAmount(inputCurrency, inputAmountRaw)
      const otherCurrencyAmount = getFormattedCurrencyAmount(outputCurrency, outputAmountRaw)
      return `${currencyAmount} ${inputCurrency.symbol} → ${otherCurrencyAmount} ${outputCurrency.symbol}`
    }
    return inputCurrency.symbol + '→' + outputCurrency.symbol
  }, [inputAmountRaw, inputCurrency, outputAmountRaw, outputCurrency, status])

  const title = formatTitleWithStatus({
    status,
    text: t('Swap'),
    showInlineWarning,
    t,
  })

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
    if (outputCurrency) {
      return (
        <BalanceUpdate
          amountRaw={outputAmountRaw}
          currency={outputCurrency}
          transactedUSDValue={transaction.typeInfo.transactedUSDValue}
          transactionStatus={transaction.status}
          transactionType={transaction.typeInfo.type}
        />
      )
    }
  }, [onRetry, outputAmountRaw, outputCurrency, status, swapFormState, t, transaction])

  return (
    <TransactionSummaryLayout
      caption={caption}
      endAdornment={endAdornment}
      icon={
        <SwapLogoOrLogoWithTxStatus
          inputCurrency={inputCurrency}
          outputCurrency={outputCurrency}
          showCancelIcon={showCancelIcon}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={status}
        />
      }
      readonly={readonly}
      showInlineWarning={showInlineWarning}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
