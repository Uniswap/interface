import { SCREEN_WIDTH } from '@gorhom/bottom-sheet'
import React, { useEffect, useState } from 'react'
import { I18nManager, LayoutChangeEvent, StyleSheet } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { AnimatedFlex, Flex, Shine, useSporeColors } from 'ui/src'
import { TextLoaderWrapper } from 'ui/src/components/text/Text'
import { fonts } from 'ui/src/theme'
import { usePrevious } from 'utilities/src/react/hooks'

export const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const NUMBER_WIDTH_ARRAY = [29, 20, 29, 29, 29, 29, 29, 29, 29, 29] // width of digits in a font
export const DIGIT_HEIGHT = 44
export const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 8

// TODO: remove need to manually define width of each character
const NUMBER_WIDTH_ARRAY_SCALED = NUMBER_WIDTH_ARRAY.map(
  (width) => width * (fonts.heading2.fontSize / fonts.heading1.fontSize)
)

const isRTL = I18nManager.isRTL

const margin = {
  // add negative margin to the correct side of each character
  marginRight: isRTL ? 0 : -ADDITIONAL_WIDTH_FOR_ANIMATIONS,
  marginLeft: isRTL ? -ADDITIONAL_WIDTH_FOR_ANIMATIONS : 0,
}

const RollNumber = ({
  digit,
  nextColor,
  index,
  chars,
  commonPrefixLength,
  shouldFadeDecimals,
}: {
  chars: string[]
  digit?: string
  nextColor?: string
  index: number
  commonPrefixLength: number
  shouldFadeDecimals: boolean
}): JSX.Element => {
  const colors = useSporeColors()
  const fontColor = useSharedValue(
    nextColor ||
      (shouldFadeDecimals && index > chars.length - 4 ? colors.neutral3.val : colors.neutral1.val)
  )
  const yOffset = useSharedValue(digit && Number(digit) >= 0 ? DIGIT_HEIGHT * -digit : 0)

  useEffect(() => {
    const finishColor =
      shouldFadeDecimals && index > chars.length - 4 ? colors.neutral3.val : colors.neutral1.val
    if (nextColor && index > commonPrefixLength - 1) {
      fontColor.value = withSequence(
        withTiming(nextColor, { duration: 250 }),
        withDelay(50, withTiming(finishColor, { duration: 310 }))
      )
    } else {
      fontColor.value = finishColor
    }
  }, [
    digit,
    nextColor,
    colors.neutral3,
    index,
    chars.length,
    colors.neutral1,
    commonPrefixLength,
    fontColor,
    shouldFadeDecimals,
  ])

  const animatedFontStyle = useAnimatedStyle(() => {
    return {
      color: fontColor.value,
    }
  })

  const numbers = NUMBER_ARRAY.map((char, idx) => {
    return (
      <Animated.Text
        key={idx}
        allowFontScaling={false}
        style={[animatedFontStyle, AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT }]}>
        {char}
      </Animated.Text>
    )
  })

  useEffect(() => {
    if (digit && Number(digit) >= 0) {
      yOffset.value = withTiming(DIGIT_HEIGHT * -digit)
    }
  })

  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: yOffset.value }],
    }
  })
  if (digit && !Number.isNaN(parseFloat(digit)) && Number(digit) >= 0) {
    return (
      <Animated.View
        style={[
          animatedWrapperStyle,
          {
            width:
              (NUMBER_WIDTH_ARRAY_SCALED[Number(digit)] || 0) + ADDITIONAL_WIDTH_FOR_ANIMATIONS,
            ...margin,
          },
        ]}>
        {numbers}
      </Animated.View>
    )
  } else {
    return (
      <Animated.Text
        allowFontScaling={false}
        style={[animatedFontStyle, AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT }]}>
        {digit}
      </Animated.Text>
    )
  }
}

const Char = ({
  index,
  chars,
  nextColor,
  commonPrefixLength,
  shouldFadeDecimals,
}: {
  index: number
  chars: string[]
  nextColor?: string
  commonPrefixLength: number
  shouldFadeDecimals: boolean
}): JSX.Element => {
  return (
    <Animated.View
      entering={nextColor ? FadeIn : undefined}
      exiting={FadeOut}
      layout={Layout}
      style={[{ height: DIGIT_HEIGHT }, AnimatedCharStyles.wrapperStyle]}>
      <RollNumber
        chars={chars}
        commonPrefixLength={commonPrefixLength}
        digit={chars[index]}
        index={index}
        nextColor={nextColor}
        shouldFadeDecimals={shouldFadeDecimals}
      />
    </Animated.View>
  )
}

function longestCommonPrefix(a: string, b: string): string {
  let i = 0
  while (a[i] && b[i] && a[i] === b[i]) {
    i++
  }
  return a.substr(0, i)
}

export const TopAndBottomGradient = (): JSX.Element => {
  const colors = useSporeColors()

  return (
    <Svg height={DIGIT_HEIGHT} style={AnimatedNumberStyles.gradientStyle} width="100%">
      <Defs>
        <LinearGradient id="backgroundTop" x1="0%" x2="0%" y1="15%" y2="0%">
          <Stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="background" x1="0%" x2="0%" y1="85%" y2="100%">
          <Stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.surface1.val} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#backgroundTop)" height={DIGIT_HEIGHT} opacity={1} width="100%" x="0" y="0" />
      <Rect fill="url(#background)" height={DIGIT_HEIGHT} opacity={1} width="100%" x="0" y="0" />
    </Svg>
  )
}

const SCREEN_WIDTH_BUFFER = 50

// Used for initial layout larger than all screen sizes
const MAX_DEVICE_WIDTH = 1000

const AnimatedNumber = ({
  value,
  loading = false,
  loadingPlaceholderText,
  colorIndicationDuration,
  shouldFadeDecimals,
  warmLoading,
}: {
  loadingPlaceholderText: string
  loading: boolean | 'no-shimmer'
  value?: string
  colorIndicationDuration: number
  shouldFadeDecimals: boolean
  warmLoading: boolean
}): JSX.Element => {
  const prevValue = usePrevious(value)
  const [chars, setChars] = useState<string[]>()
  const [commonPrefixLength, setCommonPrefixLength] = useState<number>(0)
  const [nextColor, setNextColor] = useState<string>()
  const scale = useSharedValue(1)
  const offset = useSharedValue(0)

  const colors = useSporeColors()

  const scaleWraper = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: -SCREEN_WIDTH / 2 },
        { scale: scale.value },
        { translateX: SCREEN_WIDTH / 2 },
      ],
    }
  })

  const fitBalanceOnLayout = (e: LayoutChangeEvent): void => {
    const newScale = (SCREEN_WIDTH - SCREEN_WIDTH_BUFFER) / e.nativeEvent.layout.width

    if (newScale < 1) {
      const newOffset = (e.nativeEvent.layout.width - e.nativeEvent.layout.width * newScale) / 2
      scale.value = withTiming(newScale)
      offset.value = withTiming(-newOffset)
    } else if (scale.value < 1) {
      scale.value = withTiming(1)
      offset.value = withTiming(0)
    }
  }

  useEffect(() => {
    if (value && prevValue !== value) {
      if (prevValue && value > prevValue) {
        setNextColor(colors.statusSuccess.val)
      } else if (prevValue && value < prevValue) {
        setNextColor(colors.neutral2.val)
      } else {
        setNextColor(undefined)
      }
      const newChars = value.split('')
      setChars(newChars)
      setCommonPrefixLength(longestCommonPrefix(prevValue ?? '', value).length)
      setTimeout(() => {
        setNextColor(undefined)
      }, colorIndicationDuration)
    }
  }, [colorIndicationDuration, colors.neutral2, colors.statusSuccess.val, prevValue, value])

  if (loading) {
    const placeholderChars = [...loadingPlaceholderText]

    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex alignItems="flex-start" borderRadius="$rounded4" flexDirection="row" opacity={0}>
          {placeholderChars.map((_, index) => (
            <Char
              key={
                index === 0
                  ? `$_sign_${colors.neutral1.val}`
                  : `$_number_${placeholderChars.length - index}`
              }
              chars={placeholderChars}
              commonPrefixLength={commonPrefixLength}
              index={index}
              nextColor={nextColor}
              shouldFadeDecimals={shouldFadeDecimals}
            />
          ))}
        </Flex>
      </TextLoaderWrapper>
    )
  }

  return (
    <Animated.View style={scaleWraper}>
      <Flex
        row
        alignItems="flex-start"
        backgroundColor="$surface1"
        borderRadius="$rounded4"
        width={MAX_DEVICE_WIDTH}>
        <TopAndBottomGradient />
        <Shine disabled={!warmLoading}>
          <AnimatedFlex row entering={FadeIn} width={MAX_DEVICE_WIDTH}>
            {chars?.map((_, index) => (
              <Char
                key={
                  index === 0 ? `$_sign_${colors.neutral1.val}` : `$_number_${chars.length - index}`
                }
                chars={chars}
                commonPrefixLength={commonPrefixLength}
                index={index}
                nextColor={nextColor}
                shouldFadeDecimals={shouldFadeDecimals}
              />
            ))}
          </AnimatedFlex>
        </Shine>
        <Animated.Text
          allowFontScaling={false}
          style={[AnimatedFontStyles.invisible, AnimatedFontStyles.fontStyle]}
          onLayout={fitBalanceOnLayout}>
          {value}
        </Animated.Text>
      </Flex>
    </Animated.View>
  )
}

export default AnimatedNumber

export const AnimatedNumberStyles = StyleSheet.create({
  gradientStyle: {
    position: 'absolute',
    zIndex: 100,
  },
})

export const AnimatedCharStyles = StyleSheet.create({
  wrapperStyle: {
    overflow: 'hidden',
  },
})

export const AnimatedFontStyles = StyleSheet.create({
  fontStyle: {
    fontFamily: fonts.heading2.family,
    fontSize: fonts.heading2.fontSize,
    // special case for the home screen balance, instead of using the heading2 font weight
    fontWeight: '500',
    lineHeight: fonts.heading2.lineHeight,
    top: 1,
  },
  invisible: {
    opacity: 0,
    position: 'absolute',
  },
})
