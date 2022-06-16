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
  otherSelectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
  autoFocus?: boolean
  isOutput?: boolean
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
    otherSelectedCurrency,
    showNonZeroBalancesOnly = true,
    autoFocus,
    isOutput = false,
    ...rest
  } = props

  const theme = useAppTheme()

  const transformedProps = useRestyle(restyleFunctions, rest)
  const isBlankOutputState = isOutput && !currency

  return (
    <Flex
      centered
      borderRadius="lg"
      gap="lg"
      pt={isBlankOutputState ? 'lg' : 'md'}
      {...transformedProps}>
      {!isBlankOutputState && (
        <AmountInput
          autoFocus={autoFocus}
          backgroundColor="none"
          borderWidth={0}
          fontFamily={theme.textVariants.h1.fontFamily}
          fontSize={36}
          height={36}
          placeholder="0"
          px="none"
          py="none"
          showSoftInputOnFocus={false}
          testID={'amount-input-in'}
          value={value}
          onChangeText={(newAmount: string) => onSetAmount(newAmount)}
          onPressIn={() => onSetAmount('')}
        />
      )}

      <Flex row alignItems="center" gap="xs" justifyContent="center">
        {isOutput ? (
          <Box alignItems="flex-start" flexBasis={0} flexGrow={1} />
        ) : (
          <InlineMaxAmountButton
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            onSetAmount={onSetAmount}
          />
        )}

        <Box alignItems="center">
          <CurrencySelector
            otherSelectedCurrency={otherSelectedCurrency}
            selectedCurrency={currency}
            showNonZeroBalancesOnly={showNonZeroBalancesOnly}
            onSelectCurrency={(newCurrency: Currency) => onSelectCurrency(newCurrency)}
          />
        </Box>

        <Box alignItems="flex-start" flexBasis={0} flexGrow={1} />
      </Flex>
    </Flex>
  )
}
