import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { Flex, Text } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityPositionAmountsTile({
  currency0Amount,
  currency1Amount,
  fiatValue0,
  fiatValue1,
}: {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  fiatValue0?: CurrencyAmount<Currency>
  fiatValue1?: CurrencyAmount<Currency>
}) {
  // TODO(WEB-4920): skip GraphQL call once backend provides image URLs
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const totalFiatValue = fiatValue0?.add(fiatValue1 ?? CurrencyAmount.fromRawAmount(fiatValue0.currency, 0))
  return (
    <Flex borderRadius="$rounded12" gap="$gap12" backgroundColor="$surface3" p="$padding16">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$gap16">
          <CurrencyLogo currencyInfo={currencyInfo0} size={20} />
          <Text variant="body1" color="neutral1">
            {currency0Amount.currency.symbol}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body1" color="$neutral1">
            {formatCurrencyAmount({ value: currency0Amount })}
          </Text>
          {fiatValue0 && (
            <Text variant="body1" color="$neutral2">
              ({formatCurrencyAmount({ value: fiatValue0, type: NumberType.FiatTokenPrice })})
            </Text>
          )}
          {totalFiatValue?.greaterThan(0) && fiatValue0 && (
            <Text variant="body1" color="$neutral1">
              {formatPercent(new Percent(fiatValue0.quotient, totalFiatValue.quotient).toFixed(6))}
            </Text>
          )}
        </Flex>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$gap16">
          <CurrencyLogo currencyInfo={currencyInfo1} size={20} />
          <Text variant="body1" color="$neutral1">
            {currency1Amount.currency.symbol}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body1" color="neutral1">
            {formatCurrencyAmount({ value: currency1Amount })}
          </Text>
          {fiatValue1 && (
            <Text variant="body1" color="$neutral2">
              ({formatCurrencyAmount({ value: fiatValue1, type: NumberType.FiatTokenPrice })})
            </Text>
          )}
          {totalFiatValue?.greaterThan(0) && fiatValue1 && (
            <Text variant="body1" color="$neutral1">
              {formatPercent(new Percent(fiatValue1.quotient, totalFiatValue.quotient).toFixed(6))}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
