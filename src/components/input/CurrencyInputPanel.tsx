import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { InlineMaxAmountButton } from 'src/components/buttons/MaxAmountButton'
import { CurrencySelector } from 'src/components/CurrencySelector'
import { AmountInput } from 'src/components/input/AmountInput'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Theme } from 'src/styles/theme'

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrentInputPanelProps = {
  currency: Currency | null | undefined
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSelectCurrency: (currency: Currency) => void
  onSetAmount: (amount: string) => void
  value?: string
} & RestyleProps

/** Input panel for a single side of a transfer action. */
export function CurrencyInputPanel(props: CurrentInputPanelProps) {
  const {
    currency,
    currencyAmount,
    currencyBalance,
    onSetAmount,
    onSelectCurrency,
    value,
    ...rest
  } = props

  const theme = useAppTheme()

  const transformedProps = useRestyle(restyleFunctions, rest)

  // TODO: add usd toggle
  // const price = useUSDCPrice(currency ?? undefined)

  return (
    <Flex borderRadius="lg" {...transformedProps}>
      <Flex centered gap="lg">
        <AmountInput
          autoFocus
          backgroundColor="none"
          borderWidth={0}
          flex={1}
          fontFamily={theme.textVariants.h1.fontFamily}
          fontSize={48}
          height={48}
          placeholder="0"
          px="none"
          py="none"
          showSoftInputOnFocus={false}
          testID={'amount-input-in'}
          value={value}
          onChangeText={(newAmount: string) => onSetAmount(newAmount)}
        />

        <Flex row alignItems="center" justifyContent="center">
          <InlineMaxAmountButton
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            onSetAmount={onSetAmount}
          />

          <Box alignItems="center">
            <CurrencySelector
              selectedCurrency={currency}
              showNonZeroBalancesOnly={true}
              onSelectCurrency={(newCurrency: Currency) => onSelectCurrency(newCurrency)}
            />
          </Box>

          <Box alignItems="flex-start" flexBasis={0} flexGrow={1} />
          {/* TODO: add usd toggle
          {price && (
            <Text color="gray600" variant="bodyMd">
              {t('({{price}})', { price: formatPrice(price) })}
            </Text>
          )} */}
        </Flex>
      </Flex>
    </Flex>
  )
}
