import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
  const navigate = useNavigate()
  // TODO(WEB-4920): skip GraphQL call once backend provides image URLs
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const totalFiatValue = fiatValue0?.add(fiatValue1 ?? CurrencyAmount.fromRawAmount(fiatValue0.currency, 0))

  const chainUrlParam = getChainInfo(currencyInfo0?.currency.chainId || UniverseChainId.Mainnet).urlParam
  const currency0Link = getTokenDetailsURL({
    address: currencyInfo0?.currency.isToken ? currencyInfo0?.currency.address : undefined, // util handles native addresses
    chainUrlParam,
  })
  const currency1Link = getTokenDetailsURL({
    address: currencyInfo1?.currency.isToken ? currencyInfo1?.currency.address : undefined, // util handles native addresses
    chainUrlParam,
  })

  return (
    <Flex borderRadius="$rounded12" gap="$gap12" backgroundColor="$surface3" p="$padding16">
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={() => navigate(currency0Link)} {...ClickableTamaguiStyle}>
          <Flex row alignItems="center" gap="$gap16">
            <CurrencyLogo currencyInfo={currencyInfo0} size={20} />
            <Text variant="body2" color="neutral1">
              {currency0Amount.currency.symbol}
            </Text>
          </Flex>
        </TouchableArea>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body2" color="$neutral1">
            {formatCurrencyAmount({ value: currency0Amount })}
          </Text>
          {fiatValue0?.greaterThan(0) && (
            <Text variant="body2" color="$neutral2">
              ({formatCurrencyAmount({ value: fiatValue0, type: NumberType.FiatTokenPrice })})
            </Text>
          )}
          {totalFiatValue && totalFiatValue?.toExact() !== '0' && fiatValue0 && (
            <Text variant="body2" color="$neutral1">
              {formatPercent(new Percent(fiatValue0.quotient, totalFiatValue.quotient).toFixed(6))}
            </Text>
          )}
        </Flex>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={() => navigate(currency1Link)} {...ClickableTamaguiStyle}>
          <Flex row alignItems="center" gap="$gap16">
            <CurrencyLogo currencyInfo={currencyInfo1} size={20} />
            <Text variant="body2" color="$neutral1">
              {currency1Amount.currency.symbol}
            </Text>
          </Flex>
        </TouchableArea>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body2" color="neutral1">
            {formatCurrencyAmount({ value: currency1Amount })}
          </Text>
          {fiatValue1?.greaterThan(0) && (
            <Text variant="body2" color="$neutral2">
              ({formatCurrencyAmount({ value: fiatValue1, type: NumberType.FiatTokenPrice })})
            </Text>
          )}
          {totalFiatValue && totalFiatValue?.toExact() !== '0' && fiatValue1 && (
            <Text variant="body2" color="$neutral1">
              {formatPercent(new Percent(fiatValue1.quotient, totalFiatValue.quotient).toFixed(6))}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
