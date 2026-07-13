import { Currency } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function Balance({
  currency,
  fetchedBalance,
  isAggregate = false,
  isMultichainBalance = false,
  projectName,
}: {
  currency?: Currency
  fetchedBalance?: PortfolioBalance
  isAggregate?: boolean
  isMultichainBalance?: boolean
  projectName?: string
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const formattedBalance = formatNumberOrString({
    value: fetchedBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = convertFiatAmountFormatted(fetchedBalance?.balanceUSD, NumberType.PortfolioBalance)
  const tokenSymbol = currency?.symbol
  const tokenName = projectName ?? currency?.name

  if (isAggregate) {
    return (
      <Flex row alignItems="center">
        <CurrencyLogo
          currencyInfo={fetchedBalance?.currencyInfo}
          size={iconSizes.icon32}
          hideNetworkLogo={isMultichainBalance}
        />
        <Flex shrink row width="100%" justifyContent="space-between" alignItems="center" ml="$spacing12">
          <Flex>
            <Text variant="body2" color="$neutral1">
              {tokenName}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('transaction.network.all')}
            </Text>
          </Flex>
          <Flex alignItems="flex-end">
            <AnimatedNumber
              value={formattedUsdValue}
              numericValue={fetchedBalance?.balanceUSD ?? undefined}
              textVariant="$body2"
            />
            <Text variant="body3" color="$neutral2">
              {formattedBalance} {tokenSymbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex row alignItems="center">
      <CurrencyLogo
        currencyInfo={fetchedBalance?.currencyInfo}
        size={iconSizes.icon32}
        hideNetworkLogo={isMultichainBalance}
      />
      <Flex shrink row width="100%" justifyContent="space-between" alignItems="center" ml="$spacing12">
        <Flex>
          <AnimatedNumber
            value={formattedUsdValue}
            numericValue={fetchedBalance?.balanceUSD ?? undefined}
            textVariant="$subheading2"
          />
        </Flex>
        <Flex>
          <Text variant="body3" color="$neutral2">
            {formattedBalance} {tokenSymbol}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
