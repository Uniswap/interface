import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { Text, TouchableArea } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { ElementName } from 'wallet/src/telemetry/constants'
import { maxAmountSpend } from 'wallet/src/utils/balance'

interface MaxAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetMax: (amount: string) => void
  style?: StyleProp<ViewStyle>
  currencyField: CurrencyField
}

export function MaxAmountButton({
  currencyAmount,
  currencyBalance,
  onSetMax,
  style,
  currencyField,
}: MaxAmountButtonProps): JSX.Element {
  const { t } = useTranslation()

  const maxInputAmount = maxAmountSpend(currencyBalance)

  // Disable max button if max already set or when balance is not sufficient
  const disableMaxButton =
    !maxInputAmount ||
    !maxInputAmount.greaterThan(0) ||
    currencyAmount?.toExact() === maxInputAmount.toExact()

  const onPress = (event: GestureResponderEvent): void => {
    if (!disableMaxButton) {
      event.stopPropagation()
      onSetMax(maxInputAmount.toExact())
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
        px="$spacing4"
        py="$spacing2"
        style={style}
        testID={
          currencyField === CurrencyField.INPUT ? ElementName.SetMaxInput : ElementName.SetMaxOutput
        }
        onPress={onPress}>
        <Text color="$accent1" variant="buttonLabel4">
          {t('swap.button.max')}
        </Text>
      </TouchableArea>
    </Trace>
  )
}
