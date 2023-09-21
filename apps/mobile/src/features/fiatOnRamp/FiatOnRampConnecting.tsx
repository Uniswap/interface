import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ImageBackground, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedFlex } from 'src/components/layout'
import { Flex, Text } from 'ui/src'
import {
  FOR_CONNECTING_BACKGROUND_DARK,
  FOR_CONNECTING_BACKGROUND_LIGHT,
  UNISWAP_LOGO_LARGE,
} from 'ui/src/assets'
import MoonpayLogo from 'ui/src/assets/logos/svg/moonpay.svg'
import { theme } from 'ui/src/theme/restyle'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

const ICON_SIZE = 90

export function FiatOnRampConnectingView({
  amount,
  quoteCurrencyCode,
}: {
  amount: string
  quoteCurrencyCode?: string
}): JSX.Element {
  const insets = useSafeAreaInsets()
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
          <Flex alignItems="center" justifyContent="center" style={styles.moonpayLogoWrapper}>
            <MoonpayLogo height={ICON_SIZE} width={ICON_SIZE} />
          </Flex>
        </Flex>
        <Flex centered gap="$spacing8">
          <Text variant="subheading1">{t('Connecting you to Moonpay')}</Text>
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
  moonpayLogoWrapper: {
    backgroundColor: '#7D00FF',
    borderRadius: 20,
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
  uniswapLogo: {
    height: theme.iconSizes.icon64,
    width: theme.iconSizes.icon64,
  },
  uniswapLogoWrapper: {
    backgroundColor: '#FFEFF8', // #FFD8EF with 40% opacity on a white background
    borderRadius: 20,
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
})
