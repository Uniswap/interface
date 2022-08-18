import React, { memo } from 'react'
import { Image, useColorScheme } from 'react-native'
import { ONBOARDING_BACKGROUND_DARK, ONBOARDING_BACKGROUND_LIGHT } from 'src/assets'
import { GradientBackground } from 'src/components/gradients/GradientBackground'

export const OnboardingBackground = memo(({}: { color?: string }) => {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <GradientBackground>
      <Image source={isDarkMode ? ONBOARDING_BACKGROUND_DARK : ONBOARDING_BACKGROUND_LIGHT} />
    </GradientBackground>
  )
})
