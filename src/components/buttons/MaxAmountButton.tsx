import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout'
import { maxAmountSpend } from 'src/utils/balance'

interface MaxAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetAmount: (amount: string) => void
}

export function MaxAmountButton({
  currencyAmount,
  currencyBalance,
  onSetAmount,
}: MaxAmountButtonProps) {
  const { t } = useTranslation()

  const maxInputAmount = maxAmountSpend(currencyBalance)

  // Only show max button when balance is sufficient and max amount is not already set
  const showMaxButton = Boolean(
    // TODO: consider being more explicit about showing the max button
    //      either via a param, or telling this component which CurrencyField it is
    maxInputAmount?.greaterThan(0) && !currencyAmount?.equalTo(maxInputAmount)
  )

  if (!showMaxButton || !maxInputAmount) return null

  return (
    // TODO: use `soft` button variant when available
    <PrimaryButton
      borderRadius="md"
      label={t('Max')}
      px="sm"
      py="sm"
      textVariant="smallLabel"
      variant="transparent"
      onPress={() => onSetAmount(maxInputAmount.toSignificant())}
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
