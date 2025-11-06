import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { getCurrencyForProtocol } from 'components/Liquidity/utils/currency'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export function TokenInfo({
  currencyAmount,
  currencyUSDAmount,
  isMigrating = false,
}: {
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyUSDAmount: Maybe<CurrencyAmount<Currency>>
  isMigrating?: boolean
}) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const currency = isMigrating
    ? getCurrencyForProtocol(currencyAmount?.currency, ProtocolVersion.V4)
    : currencyAmount?.currency

  return (
    <Flex row alignItems="center">
      <Flex grow>
        <Text variant="heading2">
          {formatCurrencyAmount({
            value: currencyAmount,
            type: NumberType.TokenNonTx,
          })}{' '}
          {getSymbolDisplayText(currency?.symbol)}
        </Text>
        <Text variant="body3" color="$neutral2">
          {formatCurrencyAmount({
            value: currencyUSDAmount,
            type: NumberType.FiatStandard,
          })}
        </Text>
      </Flex>
      <CurrencyLogo currency={currency} size={iconSizes.icon36} />
    </Flex>
  )
}
