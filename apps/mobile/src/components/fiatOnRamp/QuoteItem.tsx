import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { Loader } from 'src/components/loading'
import { useFormatExactCurrencyAmount } from 'src/features/fiatOnRamp/hooks'
import { Flex, Icons, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { FiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { FORQuote, FORServiceProvider } from 'wallet/src/features/fiatOnRamp/types'
import { getServiceProviderLogo } from 'wallet/src/features/fiatOnRamp/utils'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

function LogoLoader(): JSX.Element {
  return (
    <Loader.Box borderRadius="$roundedFull" height={iconSizes.icon40} width={iconSizes.icon40} />
  )
}

export function FORQuoteItem({
  quote,
  serviceProvider,
  currency,
  loading,
  baseCurrency,
  onPress,
  showCarret,
  active,
}: {
  quote: FORQuote
  serviceProvider: FORServiceProvider | undefined
  currency: Maybe<Currency>
  loading: boolean
  baseCurrency: FiatCurrencyInfo
  onPress: () => void
  showCarret?: boolean
  active?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const quoteAmount = useFormatExactCurrencyAmount(
    (quote?.destinationAmount || 0).toString(),
    currency
  )

  const quoteEquivalentInSourceCurrencyAmount = formatNumberOrString({
    value: quote.sourceAmount - quote.totalFee,
    type: NumberType.FiatStandard,
    currencyCode: baseCurrency.code.toLowerCase(),
  })

  const isDarkMode = useIsDarkMode()
  const logoUrl = getServiceProviderLogo(serviceProvider?.logos, isDarkMode)

  return (
    <TouchableArea onPress={onPress}>
      <Flex
        backgroundColor={active ? '$surface2' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        pl="$spacing16"
        pr="$spacing8"
        py="$spacing16">
        {loading ? (
          <QuoteLoader showCarret={showCarret} />
        ) : (
          <Flex row alignItems="center" gap="$spacing12">
            <Flex>
              {logoUrl ? (
                <ImageUri
                  fallback={<LogoLoader />}
                  imageStyle={ServiceProviderLogoStyles.icon}
                  uri={logoUrl}
                />
              ) : (
                <LogoLoader />
              )}
            </Flex>
            <Flex shrink gap="$spacing4">
              <Text color="$neutral1" variant="subheading2">
                {serviceProvider?.name}
              </Text>
            </Flex>
            <Flex grow row alignItems="center" gap="$spacing8" justifyContent="flex-end">
              <Flex alignItems="flex-end" gap="$spacing4">
                {quoteAmount && (
                  <Text color="$neutral1" variant="body3">
                    {t('fiatOnRamp.quote.amount', {
                      tokenAmount: `${quoteAmount + getSymbolDisplayText(currency?.symbol)}`,
                    })}
                  </Text>
                )}
                <Text color="$neutral2" variant="body3">
                  {t('fiatOnRamp.quote.amountAfterFees', {
                    tokenAmount: quoteEquivalentInSourceCurrencyAmount,
                  })}
                </Text>
              </Flex>
              {showCarret ? (
                <Icons.RotatableChevron
                  color="$neutral3"
                  direction="right"
                  height={iconSizes.icon20}
                  width={iconSizes.icon20}
                />
              ) : (
                <Flex />
              )}
            </Flex>
          </Flex>
        )}
      </Flex>
    </TouchableArea>
  )
}

function QuoteLoader({ showCarret }: { showCarret?: boolean }): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing12">
      <Loader.Box borderRadius="$roundedFull" height={iconSizes.icon40} width={iconSizes.icon40} />
      <Flex shrink gap="$spacing4">
        <Loader.Box borderRadius="$rounded4" height={fonts.subheading2.lineHeight} width={100} />
      </Flex>
      <Flex grow row alignItems="center" gap="$spacing8" justifyContent="flex-end">
        <Flex alignItems="flex-end" gap="$spacing4">
          <Loader.Box borderRadius="$rounded4" height={fonts.body3.lineHeight} width={80} />
          <Loader.Box borderRadius="$rounded4" height={fonts.body3.lineHeight} width={70} />
        </Flex>
        {showCarret ? (
          <Icons.RotatableChevron
            color="$neutral3"
            direction="right"
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        ) : (
          <Flex />
        )}
      </Flex>
    </Flex>
  )
}

const ServiceProviderLogoStyles = StyleSheet.create({
  icon: {
    height: iconSizes.icon40,
    width: iconSizes.icon40,
  },
})
