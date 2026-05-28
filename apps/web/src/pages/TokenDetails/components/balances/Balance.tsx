import { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function Balance({
  currency,
  fetchedBalance,
  isAggregate = false,
  isMultichainBalance = false,
}: {
  currency?: Currency
  fetchedBalance?: PortfolioBalance
  isAggregate?: boolean
  isMultichainBalance?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const formattedBalance = formatNumberOrString({
    value: fetchedBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = convertFiatAmountFormatted(fetchedBalance?.balanceUSD, NumberType.PortfolioBalance)
  const tokenSymbol = currency?.symbol
  const tokenName = currency?.name

  if (isAggregate) {
    return (
      <Flex row alignItems="center">
        <CurrencyLogo
          currencyInfo={fetchedBalance?.currencyInfo}
          size={iconSizes.icon32}
          hideNetworkLogo={multichainTokenUxEnabled && isMultichainBalance}
        />
        <Flex shrink row width="100%" justifyContent="space-between" alignItems="center" ml="$spacing12">
          <Flex>
            <Text variant="body2" color="$neutral1">
              {tokenName}
            </Text>
            {multichainTokenUxEnabled && (
              <Text variant="body3" color="$neutral2">
                {t('transaction.network.all')}
              </Text>
            )}
          </Flex>
          <Flex alignItems="flex-end">
            <Text variant="body2" color="$neutral1">
              {formattedUsdValue}
            </Text>
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
        hideNetworkLogo={multichainTokenUxEnabled && isMultichainBalance}
      />
      <Flex shrink row width="100%" justifyContent="space-between" alignItems="center" ml="$spacing12">
        <Flex>
          <Text variant="subheading2" color="$neutral1">
            {formattedUsdValue}
          </Text>
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
