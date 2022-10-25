import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { TextButton } from 'src/components/buttons/TextButton'
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
}: MaxAmountButtonProps) {
  const { t } = useTranslation()

  const maxInputAmount = maxAmountSpend(currencyBalance)

  // Disable max button if max already set or when balance is not sufficient
  const disableMaxButton =
    !maxInputAmount ||
    !maxInputAmount.greaterThan(0) ||
    currencyAmount?.toExact() === maxInputAmount.toExact()

  const onPress = () => {
    if (disableMaxButton) return

    onSetMax(maxInputAmount.toExact())
  }

  return (
    <TextButton
      disabled={disableMaxButton}
      style={style}
      textColor={disableMaxButton ? 'textTertiary' : 'accentAction'}
      textVariant="subheadSmall"
      onPress={onPress}>
      {t('Max')}
    </TextButton>
  )
}
