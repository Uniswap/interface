import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencySelector } from 'src/components/CurrencySelector'
import { AmountInput } from 'src/components/input/AmountInput'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { useUSDCPrice } from 'src/features/prices/useUSDCPrice'
import { Theme } from 'src/styles/theme'
import { maxAmountSpend } from 'src/utils/balance'
import { formatCurrencyAmount, formatPrice } from 'src/utils/format'

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrencyInputProps = {
  autofocus?: boolean
  currency: Currency | null | undefined
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSelectCurrency: (currency: Currency) => void
  onSetAmount: (amount: string) => void
  otherSelectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
  title?: string
} & RestyleProps

export function CurrencyInput(props: CurrencyInputProps) {
  const {
    autofocus,
    currency,
    currencyAmount,
    currencyBalance,
    onSetAmount,
    onSelectCurrency,
    showNonZeroBalancesOnly,
    otherSelectedCurrency,
    title,
    ...rest
  } = props

  const transformedProps = useRestyle(restyleFunctions, rest)

  const price = useUSDCPrice(currency ?? undefined)

  const theme = useAppTheme()
  const { t } = useTranslation()

  const maxInputAmount = maxAmountSpend(currencyBalance)
  // Only show max button when balance is sufficient and max amount is not already set
  const showMaxButton = Boolean(
    // TODO: consider being more explicit about showing the max button
    //      either via a param, or telling this component which CurrencyField it is
    showNonZeroBalancesOnly &&
      maxInputAmount?.greaterThan(0) &&
      !currencyAmount?.equalTo(maxInputAmount)
  )

  return (
    <Flex borderRadius="lg" gap="sm" mb="sm" p="md" px="md" {...transformedProps}>
      {title && (
        <Text color="gray600" variant="bodyMd">
          {title}
        </Text>
      )}
      <Flex centered flexDirection="row" gap="sm">
        <AmountInput
          autoFocus={autofocus}
          backgroundColor="none"
          borderWidth={0}
          flex={1}
          fontFamily={theme.textVariants.h1.fontFamily}
          fontSize={theme.textVariants.h1.fontSize}
          height={48}
          placeholder="0"
          px="none"
          py="none"
          value={currencyAmount?.toExact()}
          onChangeText={(newAmount: string) => onSetAmount(newAmount)}
        />
        {
          // TODO: use `soft` button variant when available
          showMaxButton && maxInputAmount && (
            <PrimaryButton
              borderRadius="md"
              label={t('MAX')}
              px="xs"
              py="xs"
              textVariant="bodyBold"
              variant="blue"
              onPress={() => onSetAmount(maxInputAmount.toSignificant())}
            />
          )
        }
        <CurrencySelector
          otherSelectedCurrency={otherSelectedCurrency}
          selectedCurrency={currency}
          showNonZeroBalancesOnly={showNonZeroBalancesOnly}
          onSelectCurrency={(newCurrency: Currency) => onSelectCurrency(newCurrency)}
        />
      </Flex>

      {currency && (
        <Flex alignContent="center" flexDirection="row" justifyContent="space-between">
          {price && (
            <Text color="gray600" variant="bodyMd">
              {formatPrice(price)}
            </Text>
          )}
          {currency && (
            <Text color="gray600" variant="bodyMd">{`${t('Balance')} ${formatCurrencyAmount(
              currencyBalance
            )}`}</Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}
