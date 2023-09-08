import { useFocusEffect } from '@react-navigation/core'
import { useResponsiveProp } from '@shopify/restyle'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ViewStyle } from 'react-native'
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { useTimeout } from 'utilities/src/time/timing'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

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
  const fitValue = useResponsiveProp({ xs: Fit.FitWidth, sm: Fit.FitHeight })

  return (
    <Rive
      ref={animationRef}
      alignment={Alignment.TopCenter}
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

  return <OnboardingAnimation />
}
