import { useFocusEffect } from '@react-navigation/core'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { LayoutChangeEvent, Platform } from 'react-native'
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Circle, Defs, LinearGradient, Stop, Svg } from 'react-native-svg'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { OpenseaElement } from 'src/features/unitags/ConfirmationElements'
import {
  BuyElement,
  FroggyElement,
  HeartElement,
  PolygonElement,
  ReceiveUSDCElement,
  SendElement,
  SwapElement,
  UniconElement,
} from 'src/screens/Onboarding/OnboardingElements'
import { Flex, Image, useIsDarkMode } from 'ui/src'
import { Jiggly } from 'ui/src/animations'
import { ONBOARDING_LANDING_DARK, ONBOARDING_LANDING_LIGHT, UNISWAP_APP_ICON } from 'ui/src/assets'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { imageSizes } from 'ui/src/theme'
import { isAndroid } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { Language } from 'wallet/src/features/language/constants'
import { useCurrentLanguage } from 'wallet/src/features/language/hooks'

const INNER_CIRCLE_SIZE = 120
const OUTER_CIRCLE_SIZE = 215

const INNER_PROPS = { radius: INNER_CIRCLE_SIZE, speed: -1, isInner: true }
const OUTER_PROPS = { radius: OUTER_CIRCLE_SIZE, speed: 1 }

const ROTATION_DURATION = 150000
const ACCELERATION_DURATION = ROTATION_DURATION / 50

const ANIMATED_ELEMENTS_INNER = [
  {
    element: <SendElement />,
    coordinates: { deg: 3.2, ...INNER_PROPS },
  },
  {
    element: <HeartElement />,
    coordinates: { deg: 2.0, ...INNER_PROPS },
  },
  {
    element: <OpenseaElement />,
    coordinates: { deg: 0.3, ...INNER_PROPS },
  },
  {
    element: <BuyElement />,
    coordinates: { deg: 5.5, ...INNER_PROPS },
  },
]
const ANIMATED_ELEMENTS_OUTER = [
  {
    element: <SwapElement />,
    coordinates: { radius: OUTER_CIRCLE_SIZE + 40, deg: 1, speed: 1, flatteningY: 0.85 },
  },
  { element: <PolygonElement />, coordinates: { deg: 2.2, ...OUTER_PROPS } },
  { element: <UniconElement />, coordinates: { deg: 3.8, ...OUTER_PROPS } },
  { element: <FroggyElement />, coordinates: { deg: 4.8, ...OUTER_PROPS } },
  {
    element: <ReceiveUSDCElement />,
    coordinates: { deg: 5.7, ...OUTER_PROPS },
  },
]

const LOGO_SCALE_DELAY = 0.5 * ONE_SECOND_MS
const LOGO_SCALE_DURATION = 0.7 * ONE_SECOND_MS
const ANIMATED_ELEMENTS_DELAY = LOGO_SCALE_DELAY + LOGO_SCALE_DURATION - 750
const INNER_CIRCLE_SHOW_DELAY = 0.3 * ONE_SECOND_MS
const OUTER_CIRCLE_SHOW_DELAY = 0.5 * ONE_SECOND_MS

export const LANDING_ANIMATION_DURATION = ANIMATED_ELEMENTS_DELAY

const OnboardingAnimation = (): JSX.Element => {
  const [boxWidth, setBoxWidth] = useState<number>(0)
  const [showAnimatedElements, setShowAnimatedElements] = useState(false)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setBoxWidth(event.nativeEvent.layout.width)
  }, [])

  const uniswapLogoScale = useSharedValue(1.5)
  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ scale: uniswapLogoScale.value }] }),
    [uniswapLogoScale]
  )

  useEffect(() => {
    uniswapLogoScale.value = withDelay(
      LOGO_SCALE_DELAY,
      withTiming(1, {
        duration: LOGO_SCALE_DURATION,
        easing: Easing.elastic(1.1),
      })
    )
  }, [uniswapLogoScale])

  useTimeout(() => {
    setShowAnimatedElements(true)
  }, ANIMATED_ELEMENTS_DELAY)

  return (
    <Flex grow justifyContent="center" onLayout={onLayout}>
      {showAnimatedElements ? <AnimatedElements width={boxWidth} /> : null}
      <AnimatedFlex alignSelf="center" position="absolute" style={animatedStyle}>
        <Jiggly duration={75} offset={5}>
          <Image
            height={imageSizes.image100}
            resizeMode="contain"
            source={UNISWAP_APP_ICON}
            width={imageSizes.image100}
          />
        </Jiggly>
      </AnimatedFlex>
    </Flex>
  )
}

const INITIAL_ANIMATION_LENGTH = 0.1

const AnimatedElements = ({ width }: { width: number }): JSX.Element | null => {
  const rotation = useSharedValue(0)
  const innerAnimation = useSharedValue(0)
  const outerAnimation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withDelay(
      1800,
      withSequence(
        withTiming(INITIAL_ANIMATION_LENGTH, {
          duration: ACCELERATION_DURATION,
          easing: Easing.in(Easing.ease),
        }),
        withRepeat(
          withTiming(2 * Math.PI + INITIAL_ANIMATION_LENGTH, {
            duration: ROTATION_DURATION,
            easing: Easing.linear,
          }),
          -1
        )
      )
    )
    innerAnimation.value = withDelay(INNER_CIRCLE_SHOW_DELAY, withSpring(1))
    outerAnimation.value = withDelay(OUTER_CIRCLE_SHOW_DELAY, withSpring(1))
  }, [innerAnimation, outerAnimation, rotation])

  const innerCircleStyle = useAnimatedStyle(() => {
    return {
      opacity: innerAnimation.value,
    }
  })

  const outerCircleStyle = useAnimatedStyle(() => {
    return {
      opacity: outerAnimation.value,
    }
  })

  return (
    <Flex centered grow>
      <Animated.View key="Circle1" style={[{ position: 'absolute' }, innerCircleStyle]}>
        <Svg height={width * 2} width={width}>
          <Defs>
            <LinearGradient id="grad" x1="-0.25" x2="-0.1" y1="0.8" y2="0">
              <Stop offset="0" stopColor="#e1e1e1" stopOpacity="0.8" />
              <Stop offset="0.25" stopColor="#FFD080" stopOpacity="0" />
              <Stop offset="0.75" stopColor="#FFD080" stopOpacity="0" />
              <Stop offset="1" stopColor="#e1e1e1" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={width / 2}
            cy={width}
            fillOpacity={0}
            r={INNER_CIRCLE_SIZE}
            stroke="url(#grad)"
            strokeWidth="0.5"
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, outerCircleStyle]}>
        <Svg height={width * 2} width={width}>
          <Defs>
            <LinearGradient id="grad" x1="-0.25" x2="-0.1" y1="0.8" y2="0">
              <Stop offset="0" stopColor="#e1e1e1" stopOpacity="0.8" />
              <Stop offset="0.25" stopColor="#FFD080" stopOpacity="0" />
              <Stop offset="0.75" stopColor="#FFD080" stopOpacity="0" />
              <Stop offset="1" stopColor="#e1e1e1" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={width / 2}
            cy={width}
            fillOpacity={0}
            r={OUTER_CIRCLE_SIZE}
            stroke="url(#grad)"
            strokeWidth="0.5"
          />
        </Svg>
      </Animated.View>
      {ANIMATED_ELEMENTS_INNER.map(({ element, coordinates }, index) => (
        <RotateElement
          key={`${index}_ICON_INNER`}
          coordinates={coordinates}
          element={element}
          innerAnimation={innerAnimation}
          outerAnimation={outerAnimation}
          rotation={rotation}
        />
      ))}
      {ANIMATED_ELEMENTS_OUTER.map(({ element, coordinates }, index) => (
        <RotateElement
          key={`${index}_ICON_OUTER`}
          coordinates={coordinates}
          element={element}
          innerAnimation={innerAnimation}
          outerAnimation={outerAnimation}
          rotation={rotation}
        />
      ))}
    </Flex>
  )
}

const RotateElement = ({
  element,
  coordinates,
  innerAnimation,
  outerAnimation,
  rotation,
}: {
  element: ReactElement
  coordinates: {
    radius: number
    deg: number
    speed: number
    flatteningY?: number
    isInner?: boolean
  }
  innerAnimation: SharedValue<number>
  outerAnimation: SharedValue<number>
  rotation: SharedValue<number>
}): ReactElement => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      justifyContent: 'center',
      position: 'absolute',
      opacity: coordinates.isInner ? innerAnimation.value : outerAnimation.value,
      transform: [
        {
          scale: 0.9 + (coordinates.isInner ? innerAnimation.value : outerAnimation.value) * 0.1,
        },
        {
          translateX:
            Math.cos((rotation.value + coordinates.deg) * coordinates.speed) * coordinates.radius,
        },
        {
          translateY:
            Math.sin((rotation.value + coordinates.deg) * coordinates.speed) *
            coordinates.radius *
            (coordinates.flatteningY || 1),
        },
      ],
    }
  })

  return (
    <Animated.View style={animatedStyle}>
      <Jiggly>{element}</Jiggly>
    </Animated.View>
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
    // resets the animation to restart when the screen is mounted again (eg. going back)
    return null
  }

  // TODO: In Gradle there is a  minSdkVersion = 28 requirement, but in the conditional statement below the comment we check if SDK is smaller than 30, we can remove it after we bump the minimal SDK version to at least 30
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
