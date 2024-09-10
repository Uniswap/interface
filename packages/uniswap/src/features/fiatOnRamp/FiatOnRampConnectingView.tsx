import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, Image, Text, useDeviceInsets } from 'ui/src'
import { UNISWAP_LOGO_LARGE } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'

export function FiatOnRampConnectingView({
  amount,
  quoteCurrencyCode,
  serviceProviderName,
  serviceProviderLogo,
}: {
  amount?: string
  quoteCurrencyCode?: string
  serviceProviderName: string
  serviceProviderLogo?: JSX.Element
}): JSX.Element {
  const insets = useDeviceInsets()
  const { t } = useTranslation()

  return (
    <Flex justifyContent="center" position="relative">
      <AnimatePresence>
        <Flex centered grow style={{ marginBottom: insets.bottom }}>
          <Flex row gap="$spacing16" pb="$spacing16">
            <Flex alignItems="center" justifyContent="center" style={ServiceProviderLogoStyles.uniswapLogoWrapper}>
              <Image height={iconSizes.icon64} source={UNISWAP_LOGO_LARGE} width={iconSizes.icon64} />
            </Flex>
            {serviceProviderLogo}
          </Flex>
          <Flex centered gap="$spacing8">
            <Text variant="subheading1">
              {t('fiatOnRamp.connection.message', { serviceProvider: serviceProviderName })}
            </Text>
            {quoteCurrencyCode && amount && (
              <Text color="$neutral2" variant="body2">
                {t('fiatOnRamp.connection.quote', {
                  amount,
                  currencySymbol: quoteCurrencyCode,
                })}
              </Text>
            )}
          </Flex>
        </Flex>
      </AnimatePresence>
    </Flex>
  )
}
