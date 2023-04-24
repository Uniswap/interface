import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Text } from 'src/components/Text'
import { maxAmountSpend } from 'src/utils/balance'

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

  const onPress = (): void => {
    if (disableMaxButton) return

    onSetMax(maxInputAmount.toExact())
  }

  return (
    <TouchableArea disabled={disableMaxButton} style={style} onPress={onPress}>
      <Text color={disableMaxButton ? 'textTertiary' : 'magentaVibrant'} variant="subheadSmall">
        {t('Max')}
      </Text>
    </TouchableArea>
  )
}
