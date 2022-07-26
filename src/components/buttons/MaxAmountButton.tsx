import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType, StyleProp, ViewStyle } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout'
import { maxAmountSpend } from 'src/utils/balance'

interface MaxAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetMax: (amount: string) => void
  style?: StyleProp<ViewStyle>
}

const MAX_AMOUNT_SIG_FIGS = 6 // default for .toSignificant()

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
    currencyAmount?.toSignificant(MAX_AMOUNT_SIG_FIGS) ===
      maxInputAmount.toSignificant(MAX_AMOUNT_SIG_FIGS)

  const onPress = () => {
    if (disableMaxButton) return

    onSetMax(maxInputAmount.toSignificant(MAX_AMOUNT_SIG_FIGS))
  }

  return (
    <PrimaryButton
      borderRadius="md"
      disabled={disableMaxButton}
      label={t('Max')}
      px="xs"
      py="sm"
      style={style}
      textVariant="smallLabel"
      variant="transparent"
      onPress={onPress}
    />
  )
}

type InlineMaxAmountButtonProps = MaxAmountButtonProps & { alignItems?: FlexAlignType }

/** Wraps MaxAmountButton in a box to specify common layout props */
export function InlineMaxAmountButton({
  // inline max button typically found centered to the right in mocks
  alignItems = 'flex-end',
  ...props
}: InlineMaxAmountButtonProps) {
  return (
    /* flex-grow/basis on first/child to keep middle always centered on screen */
    <Box alignItems={alignItems} flexBasis={0} flexGrow={1}>
      <MaxAmountButton {...props} />
    </Box>
  )
}
