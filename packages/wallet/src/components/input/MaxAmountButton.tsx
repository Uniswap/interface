import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { Text, TouchableArea } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { ElementName } from 'wallet/src/telemetry/constants'
import { maxAmountSpend } from 'wallet/src/utils/balance'

interface MaxAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetMax: (amount: string) => void
  style?: StyleProp<ViewStyle>
}

export function MaxAmountButton({
  currencyAmount,
  currencyBalance,
  onSetMax,
  style,
}: MaxAmountButtonProps): JSX.Element {
  const { t } = useTranslation()

  const maxInputAmount = maxAmountSpend(currencyBalance)

  // Disable max button if max already set or when balance is not sufficient
  const disableMaxButton =
    !maxInputAmount ||
    !maxInputAmount.greaterThan(0) ||
    currencyAmount?.toExact() === maxInputAmount.toExact()

  const onPress = (event: GestureResponderEvent): void => {
    event.stopPropagation()

    if (disableMaxButton) {
      return
    }

    onSetMax(maxInputAmount.toExact())
  }

  return (
    <Trace logPress element={ElementName.SetMaxInput}>
      <TouchableArea disabled={disableMaxButton} style={style} onPress={onPress}>
        <Text color={disableMaxButton ? '$neutral3' : '$accent1'} variant="subheading2">
          {t('swap.button.max')}
        </Text>
      </TouchableArea>
    </Trace>
  )
}
