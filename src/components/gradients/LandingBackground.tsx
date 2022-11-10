import React, { useEffect, useRef } from 'react'
import { useColorScheme, ViewStyle } from 'react-native'
import Rive, { Alignment, Fit, LoopMode, RiveRef } from 'rive-react-native'

const animationStyles: ViewStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
}

export const LandingBackground = () => {
  const isDarkMode = useColorScheme() === 'dark'
  const animationRef = useRef<RiveRef>(null)

  useEffect(() => {
    // reset to ensure animation plays again when changing from light to dark mode
    animationRef.current?.reset()
    animationRef.current?.play('Intro', LoopMode.Loop)
  }, [isDarkMode])

  return (
    <Rive
      ref={animationRef}
      alignment={Alignment.TopCenter}
      animationName="Intro"
      artboardName="Unified"
      autoplay={false}
      fit={Fit.FitHeight}
      resourceName={isDarkMode ? 'OnboardingDark' : 'OnboardingLight'}
      style={animationStyles}
    />
  )
}
