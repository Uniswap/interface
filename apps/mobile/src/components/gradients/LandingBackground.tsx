import { useFocusEffect } from '@react-navigation/core'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Platform, ViewStyle } from 'react-native'
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useIsDarkMode, useMedia } from 'ui/src'
import { ONBOARDING_LANDING_DARK, ONBOARDING_LANDING_LIGHT } from 'ui/src/assets'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { isAndroid } from 'uniswap/src/utils/platform'
import { useTimeout } from 'utilities/src/time/timing'
import { Language } from 'wallet/src/features/language/constants'
import { useCurrentLanguage } from 'wallet/src/features/language/hooks'

const stateMachineName = 'State Machine 1'

const animationStyles: ViewStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
}

const OnboardingAnimation = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  const animationRef = useRef<RiveRef>(null)
  const media = useMedia()
  const fitValue = media.short ? Fit.Cover : Fit.FitHeight
  const alignmentValue = media.short ? Alignment.BottomCenter : Alignment.Center

  return (
    <Rive
      ref={animationRef}
      alignment={alignmentValue}
      animationName="Intro"
      artboardName="Unified"
      fit={fitValue}
      resourceName={isDarkMode ? 'onboarding_dark' : 'onboarding_light'}
      stateMachineName={stateMachineName}
      style={animationStyles}
    />
  )
}

export const LandingBackground = (): JSX.Element | null => {
  const navigation = useAppStackNavigation()
  const [blurred, setBlurred] = useState(false)
  const [hideAnimation, setHideAnimation] = useState(false)
  const language = useCurrentLanguage()

  useEffect(() => {
    return navigation.addListener('blur', () => {
      // set this flag on blur (when navigating to another screen)
      setBlurred(true)
    })
  }, [navigation])

  // callback to turn off the animation (so that we can turn it back
  // on on focus)
  const turnAnimationOff = useCallback(() => {
    if (blurred) {
      setHideAnimation(true)
    }
  }, [blurred])

  // but make sure it's delayed a tiny bit, otherwise blur triggers
  // immediately, so the animation would disappear before the screen
  // transition animation happens
  useTimeout(turnAnimationOff, 500)

  // reset animation when focusing on this screen again
  useFocusEffect(() => {
    setBlurred(false)
    setHideAnimation(false)
  })

  if (hideAnimation) {
    // this is an alternative way to "reset" the animation, because
    // something about calling Rive's ref functions like .reset() and
    // .play() seems to cause very hard-to-debug crashes in the
    // underlying Swift code
    return null
  }

  // Android 9 and 10 have issues with Rive, so we fallback on image
  if (
    // Android Platform.Version is always a number
    (isAndroid && typeof Platform.Version === 'number' && Platform.Version < 30) ||
    language !== Language.English
  ) {
    return <OnboardingStaticImage />
  }

  return <OnboardingAnimation />
}

const OnboardingStaticImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  const { fullHeight, fullWidth } = useDeviceDimensions()
  return (
    <Image
      source={
        isDarkMode
          ? Platform.select(ONBOARDING_LANDING_DARK)
          : Platform.select(ONBOARDING_LANDING_LIGHT)
      }
      style={{ height: fullHeight, width: fullWidth }}
    />
  )
}
