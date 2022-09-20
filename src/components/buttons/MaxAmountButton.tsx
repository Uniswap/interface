import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
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
    <PrimaryButton
      borderRadius="md"
      disabled={disableMaxButton}
      label={t('Max')}
      p="xs"
      style={style}
      textVariant="smallLabel"
      variant="transparent"
      onPress={onPress}
    />
  )
}
