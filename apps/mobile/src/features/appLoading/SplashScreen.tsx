import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { Flex, useIsDarkMode } from 'ui/src'
import { UNISWAP_MONO_LOGO_LARGE } from 'ui/src/assets'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { isAndroid } from 'utilities/src/platform'

export const SPLASH_SCREEN_IMAGE_SIZE = 150

export function SplashScreen(): JSX.Element {
  const dimensions = useDeviceDimensions()
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      alignItems="center"
      backgroundColor={isDarkMode ? '$surface1' : '$white'}
      justifyContent={isAndroid ? 'center' : undefined}
      pointerEvents="none"
      style={{
        height: dimensions.fullHeight,
        width: dimensions.fullWidth,
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      <Image source={UNISWAP_MONO_LOGO_LARGE} style={fixedStyle.logoStyle} />
    </Flex>
  )
}

const fixedStyle = StyleSheet.create({
  logoStyle: {
    height: SPLASH_SCREEN_IMAGE_SIZE,
    width: SPLASH_SCREEN_IMAGE_SIZE,
  },
})
