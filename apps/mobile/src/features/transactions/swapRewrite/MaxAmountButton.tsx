import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import Trace from 'src/components/Trace/Trace'
import { ElementName } from 'src/features/telemetry/constants'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { maxAmountSpend } from 'src/utils/balance'
import { Text, TouchableArea } from 'ui/src'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

interface MaxAmountButtonProps {
  onSetMax: (amount: string, currencyField: CurrencyField) => void
  style?: StyleProp<ViewStyle>
  currencyField: CurrencyField
}

export function MaxAmountButton({
  onSetMax,
  style,
  currencyField,
}: MaxAmountButtonProps): JSX.Element {
  const { t } = useTranslation()

  const { derivedSwapInfo } = useSwapFormContext()
  const { currencyBalances, currencyAmounts } = derivedSwapInfo

  // We always reference the input balance, as we calculate the max amount spend based on exact-in trade.
  const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
  const inputCurrencyBalance = currencyBalances[CurrencyField.INPUT]

  const maxInputAmount = maxAmountSpend(inputCurrencyBalance)

  // Disable max button if max already set or when balance is not sufficient
  const disableMaxButton =
    !maxInputAmount ||
    !maxInputAmount.greaterThan(0) ||
    inputCurrencyAmount?.toExact() === maxInputAmount.toExact()

  const onPress = (): void => {
    if (!disableMaxButton) {
      onSetMax(maxInputAmount.toExact(), currencyField)
    }
  }

  return (
    <Trace
      logPress
      element={
        currencyField === CurrencyField.INPUT ? ElementName.SetMaxInput : ElementName.SetMaxOutput
      }>
      <TouchableArea
        hapticFeedback
        backgroundColor="$accentSoft"
        borderRadius="$rounded8"
        disabled={disableMaxButton}
        opacity={disableMaxButton ? 0.5 : 1}
        paddingHorizontal="$spacing4"
        paddingVertical="$spacing2"
        style={style}
        onPress={onPress}>
        <Text color="$accent1" variant="buttonLabel4">
          {currencyField === CurrencyField.OUTPUT ? t('Get max') : t('Max')}
        </Text>
      </TouchableArea>
    </Trace>
  )
}
