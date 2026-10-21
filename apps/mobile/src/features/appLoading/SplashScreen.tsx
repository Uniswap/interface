import { isAndroid } from '@universe/environment'
import { Flex } from '@universe/mycelium'
import { UNISWAP_MONO_LOGO_LARGE } from '@universe/mycelium/assets'
import { useDeviceDimensions, useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import React from 'react'
import { Image, StyleSheet } from 'react-native'

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
