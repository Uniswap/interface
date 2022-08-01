import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { InlineMaxAmountButton } from 'src/components/buttons/MaxAmountButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencySelector } from 'src/components/CurrencySelector'
import { AmountInput } from 'src/components/input/AmountInput'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { Warning, WarningLabel } from 'src/components/warnings/types'
import { Theme } from 'src/styles/theme'
import { formatCurrencyAmount } from 'src/utils/format'

const TOGGLE_PADDING_VERTICAL = 10 // custom value to keep components same height
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
  showSoftInputOnFocus?: boolean
  autoFocus?: boolean
  isOutput?: boolean
  isUSDInput?: boolean
  onSetMax?: (amount: string) => void
  onToggleUSDInput?: () => void
  onPressIn?: () => void
  warnings: Warning[]
  dimTextColor?: boolean
} & RestyleProps

/** Input panel for a single side of a transfer action. */
export function CurrencyInputPanel(props: CurrentInputPanelProps) {
  const {
    currency,
    currencyAmount,
    currencyBalance,
    onSetAmount,
    onSetMax,
    onSelectCurrency,
    value,
    otherSelectedCurrency,
    showNonZeroBalancesOnly = true,
    showSoftInputOnFocus = false,
    autoFocus,
    isOutput = false,
    isUSDInput = false,
    onToggleUSDInput,
    onPressIn,
    warnings,
    dimTextColor,
    ...rest
  } = props

  const theme = useAppTheme()
  const { t } = useTranslation()
  const transformedProps = useRestyle(restyleFunctions, rest)
  const isBlankOutputState = isOutput && !currency

  const insufficientBalanceWarning = warnings.find(
    (warning) => warning.type === WarningLabel.InsufficientFunds
  )

  return (
    <Flex
      centered
      borderRadius="lg"
      gap="sm"
      pt={isBlankOutputState ? 'lg' : 'md'}
      {...transformedProps}>
      {!isBlankOutputState && (
        <AmountInput
          alignSelf="stretch"
          autoFocus={autoFocus}
          backgroundColor="none"
          borderWidth={0}
          dimTextColor={dimTextColor}
          fontFamily={theme.textVariants.headlineLarge.fontFamily}
          fontSize={36}
          height={36}
          placeholder="0"
          placeholderTextColor={theme.colors.textSecondary}
          px="none"
          py="none"
          showCurrencySign={isUSDInput}
          showSoftInputOnFocus={showSoftInputOnFocus}
          testID={isOutput ? 'amount-input-out' : 'amount-input-in'}
          textAlign="center"
          value={value}
          onChangeText={(newAmount: string) => onSetAmount(newAmount)}
          onPressIn={onPressIn}
        />
      )}

      {!isOutput && insufficientBalanceWarning && (
        <Text color="accentWarning" variant="caption">
          {insufficientBalanceWarning.title}
        </Text>
      )}

      {!isOutput && currency && !insufficientBalanceWarning && (
        <Text color="textSecondary" variant="caption">
          {t('Balance')}: {formatCurrencyAmount(currencyBalance)} {currency.symbol}
        </Text>
      )}

      <Flex row alignItems="center" gap="xs" justifyContent="center">
        {onSetMax ? (
          <InlineMaxAmountButton
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            style={{ paddingVertical: TOGGLE_PADDING_VERTICAL }}
            onSetMax={onSetMax}
          />
        ) : (
          <Box alignItems="flex-start" flexBasis={0} flexGrow={1} />
        )}
        <Box alignItems="center">
          <CurrencySelector
            otherSelectedCurrency={otherSelectedCurrency}
            selectedCurrency={currency}
            showNonZeroBalancesOnly={showNonZeroBalancesOnly}
            onSelectCurrency={(newCurrency: Currency) => onSelectCurrency(newCurrency)}
          />
        </Box>

        <Box alignItems="flex-start" flexBasis={0} flexGrow={1}>
          {onToggleUSDInput ? (
            <PrimaryButton
              borderRadius="md"
              label={t('USD')}
              px="xs"
              style={{ paddingVertical: TOGGLE_PADDING_VERTICAL }}
              testID="toggle-usd"
              textVariant="smallLabel"
              variant={isUSDInput ? 'transparentBlue' : 'transparent'}
              onPress={onToggleUSDInput}
            />
          ) : null}
        </Box>
      </Flex>
    </Flex>
  )
}
