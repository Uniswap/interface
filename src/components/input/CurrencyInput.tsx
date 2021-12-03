import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { StyleSheet } from 'react-native'
import { CurrencySelector } from 'src/components/CurrencySelector'
import { AmountInput } from 'src/components/input/AmountInput'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import useUSDCPrice from 'src/features/prices/useUSDCPrice'
import { textVariants } from 'src/styles/font'
import { Theme } from 'src/styles/theme'
import { formatCurrencyAmount, formatPrice } from 'src/utils/format'

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrencyInputProps = {
  currency: Currency | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  onSelectCurrency: (currency: Currency) => void
  onSetAmount: (amount: string) => void
} & RestyleProps

export function CurrencyInput(props: CurrencyInputProps) {
  const { currency, currencyAmount, currencyBalance, onSetAmount, onSelectCurrency, ...rest } =
    props

  const transformedProps = useRestyle(restyleFunctions, rest)

  const price = useUSDCPrice(currency ?? undefined)

  return (
    <Box alignItems="center" py="md" pr="md" my="md" borderRadius="md" {...transformedProps}>
      <Box flexDirection="row">
        <AmountInput
          borderWidth={0}
          onChangeText={(newAmount: string) => onSetAmount(newAmount)}
          placeholder="0.0"
          mr="sm"
          value={currencyAmount?.toSignificant(6)}
          style={styles.amountInput}
        />
        <CurrencySelector
          onSelectCurrency={(newCurrency: Currency) => onSelectCurrency(newCurrency)}
          selectedCurrency={currency}
        />
      </Box>
      <Box flexDirection="row">
        <Box flex={1} flexDirection="row" justifyContent="space-between">
          <Text variant="body" ml="md">
            {formatPrice(price)}
          </Text>
          <Text variant="body">{formatCurrencyAmount(currencyBalance)}</Text>
        </Box>
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  amountInput: {
    backgroundColor: 'transparent',
    height: 48,
    fontSize: textVariants.h1.fontSize,
    flex: 1,
  },
})
