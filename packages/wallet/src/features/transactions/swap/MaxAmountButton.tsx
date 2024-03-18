import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { Text, TouchableArea } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { ElementName } from 'wallet/src/telemetry/constants'
import { maxAmountSpend } from 'wallet/src/utils/balance'

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
