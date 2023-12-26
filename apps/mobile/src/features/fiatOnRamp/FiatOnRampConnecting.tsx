import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ImageBackground, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Flex, Text, useDeviceInsets } from 'ui/src'
import {
  FOR_CONNECTING_BACKGROUND_DARK,
  FOR_CONNECTING_BACKGROUND_LIGHT,
  UNISWAP_LOGO_LARGE,
} from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

export const SERVICE_PROVIDER_ICON_SIZE = 90

export function FiatOnRampConnectingView({
  amount,
  quoteCurrencyCode,
  serviceProviderName,
  serviceProviderLogo,
}: {
  amount: string
  quoteCurrencyCode?: string
  serviceProviderName: string
  serviceProviderLogo?: JSX.Element
}): JSX.Element {
  const insets = useDeviceInsets()
  const { t } = useTranslation()

  const isDarkMode = useIsDarkMode()
  return (
    <ImageBackground
      resizeMode="cover"
      source={isDarkMode ? FOR_CONNECTING_BACKGROUND_DARK : FOR_CONNECTING_BACKGROUND_LIGHT}
      style={styles.background}>
      <AnimatedFlex
        centered
        grow
        entering={FadeIn}
        exiting={FadeOut}
        style={{ marginBottom: insets.bottom }}>
        <Flex row gap="$spacing16" pb="$spacing16">
          <Flex alignItems="center" justifyContent="center" style={styles.uniswapLogoWrapper}>
            <Image source={UNISWAP_LOGO_LARGE} style={styles.uniswapLogo} />
          </Flex>
          {serviceProviderLogo}
        </Flex>
        <Flex centered gap="$spacing8">
          <Text variant="subheading1">
            {t('Connecting you to {{serviceProvider}}', { serviceProvider: serviceProviderName })}
          </Text>
          {quoteCurrencyCode && (
            <Text color="$neutral2" variant="body2">
              {t('Buying {{amount}} worth of {{quoteCurrencyCode}}', {
                amount,
                quoteCurrencyCode,
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
    borderRadius: 20,
    height: SERVICE_PROVIDER_ICON_SIZE,
    width: SERVICE_PROVIDER_ICON_SIZE,
  },
})
