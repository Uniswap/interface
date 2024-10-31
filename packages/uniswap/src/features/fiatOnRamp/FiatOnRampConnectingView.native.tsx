import { useTranslation } from 'react-i18next'
import { Image, ImageBackground, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Flex, Text, useIsDarkMode } from 'ui/src'
import { FOR_CONNECTING_BACKGROUND_DARK, FOR_CONNECTING_BACKGROUND_LIGHT, UNISWAP_LOGO_LARGE } from 'ui/src/assets'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import {
  SERVICE_PROVIDER_ICON_BORDER_RADIUS,
  ServiceProviderLogoStyles,
} from 'uniswap/src/features/fiatOnRamp/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export function FiatOnRampConnectingView({
  isOffRamp,
  amount,
  quoteCurrencyCode,
  serviceProviderName,
  serviceProviderLogo,
}: {
  isOffRamp?: boolean
  amount?: string
  quoteCurrencyCode?: string
  serviceProviderName: string
  serviceProviderLogo?: JSX.Element
}): JSX.Element {
  const insets = useAppInsets()
  const { t } = useTranslation()

  const isDarkMode = useIsDarkMode()
  return (
    <ImageBackground
      resizeMode="cover"
      source={isDarkMode ? FOR_CONNECTING_BACKGROUND_DARK : FOR_CONNECTING_BACKGROUND_LIGHT}
      style={styles.background}
    >
      <AnimatedFlex centered grow entering={FadeIn} exiting={FadeOut} style={{ marginBottom: insets.bottom }}>
        <Flex row gap="$spacing16" pb="$spacing16">
          <Flex alignItems="center" justifyContent="center" style={styles.uniswapLogoWrapper}>
            <Image source={UNISWAP_LOGO_LARGE} style={styles.uniswapLogo} />
          </Flex>
          {serviceProviderLogo}
        </Flex>
        <Flex centered gap="$spacing8">
          <Text variant="subheading1">
            {t('fiatOnRamp.connection.message', { serviceProvider: serviceProviderName })}
          </Text>
          {quoteCurrencyCode && amount && (
            <Text color="$neutral2" variant="body2">
              {isOffRamp
                ? t('fiatOffRamp.connection.quote', {
                    amount,
                    currencySymbol: quoteCurrencyCode,
                  })
                : t('fiatOnRamp.connection.quote', {
                    amount,
                    currencySymbol: quoteCurrencyCode,
                  })}
            </Text>
          )}
        </Flex>
      </AnimatedFlex>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  uniswapLogo: {
    height: iconSizes.icon64,
    width: iconSizes.icon64,
  },
  uniswapLogoWrapper: {
    backgroundColor: '#FFEFF8', // #FFD8EF with 40% opacity on a white background
    borderRadius: SERVICE_PROVIDER_ICON_BORDER_RADIUS,
    height: ServiceProviderLogoStyles.icon.height,
    width: ServiceProviderLogoStyles.icon.width,
  },
})
