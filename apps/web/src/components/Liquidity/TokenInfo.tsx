import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export function TokenInfo({
  currencyAmount,
  currencyUSDAmount,
}: {
  currencyAmount?: CurrencyAmount<Currency>
  currencyUSDAmount?: CurrencyAmount<Currency>
}) {
  const { formatCurrencyAmount } = useLocalizationContext()

  return (
    <Flex row alignItems="center">
      <Flex grow>
        <Text variant="heading2">
          {formatCurrencyAmount({
            value: currencyAmount,
            type: NumberType.TokenNonTx,
          })}{' '}
          {getSymbolDisplayText(currencyAmount?.currency.symbol)}
        </Text>
        <Text variant="body3" color="$neutral2">
          {formatCurrencyAmount({
            value: currencyUSDAmount,
            type: NumberType.FiatStandard,
          })}
        </Text>
      </Flex>
      <CurrencyLogo currency={currencyAmount?.currency} size={iconSizes.icon36} />
    </Flex>
  )
}
