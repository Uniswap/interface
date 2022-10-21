import { LinearGradient } from 'expo-linear-gradient'
import React, { memo } from 'react'
import { Image, ImageStyle, StyleSheet, useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import {
  LANDING_BACKGROUND_DARK,
  LANDING_BACKGROUND_LIGHT,
  LANDING_BLUR_BACKGROUND_DARK,
  LANDING_BLUR_BACKGROUND_LIGHT,
} from 'src/assets'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { opacify } from 'src/utils/colors'
import { Box } from '../layout'

const backgroundImageStyle: ImageStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 54,
  bottom: 0,
  width: '100%',
  height: '100%',
}

export const LandingBackground = memo(() => {
  const isDarkMode = useColorScheme() === 'dark'
  const theme = useAppTheme()

  return (
    <GradientBackground>
      <Image
        source={isDarkMode ? LANDING_BACKGROUND_DARK : LANDING_BACKGROUND_LIGHT}
        style={backgroundImageStyle}
      />
      <Box left={0} position="absolute" right={0} top={0}>
        <Image source={isDarkMode ? LANDING_BLUR_BACKGROUND_DARK : LANDING_BLUR_BACKGROUND_LIGHT} />
      </Box>
      <Box bottom={0} height={255} left={0} position="absolute" right={0}>
        <LinearGradient
          colors={[opacify(0, theme.colors.background0), opacify(100, theme.colors.background0)]}
          end={{ x: 0.5, y: 0.5 }}
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Box>
    </GradientBackground>
  )
})
