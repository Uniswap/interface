import { SCREEN_WIDTH } from '@gorhom/bottom-sheet'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent, TextStyle, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Shine } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text, TextLoaderWrapper } from 'ui/src/components/text/Text'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { fonts } from 'ui/src/theme'
import { TopAndBottomGradient } from 'uniswap/src/components/AnimatedNumber/TopAndBottomGradient'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWebPlatform } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// This ensures the color changes quicker after animating on web platforms. This could be
// safe for mobile to be the same but was kept the same as this animation is fragile
export const BALANCE_CHANGE_INDICATION_DURATION = isWebPlatform ? ONE_SECOND_MS / 2 : ONE_SECOND_MS * 2

export const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const NUMBER_WIDTH_ARRAY = [29, 20, 29, 29, 29, 29, 29, 29, 29, 29] // width of digits in a font
const SPACE_SIZE = isWebPlatform ? 0 : 2
export const DIGIT_HEIGHT = 40 // matches heading2 lineHeight
export const DIGIT_MAX_WIDTH = 29
export const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 8

const ICON_LEFT_MARGIN = 4

// TODO: remove need to manually define width of each character
const NUMBER_WIDTH_ARRAY_SCALED = NUMBER_WIDTH_ARRAY.map(
  (width) => width * (fonts.heading2.fontSize / fonts.heading1.fontSize),
)

const RollNumber = ({
  digit,
  nextColor,
  index,
  chars,
  commonPrefixLength,
  shouldFadeDecimals,
  currency,
  isRightToLeft,
}: {
  chars: string[]
  digit?: string
  nextColor?: string
  index: number
  commonPrefixLength: number
  shouldFadeDecimals: boolean
  currency: FiatCurrencyInfo
  isRightToLeft: boolean
}): JSX.Element => {
  const colors = useSporeColors()
  const lastChars = useRef([''])
  const decimalSeparatorIndex = chars.indexOf(currency.decimalSeparator) - 1
  const fontColor = useSharedValue(
    nextColor || (shouldFadeDecimals && index > decimalSeparatorIndex ? colors.neutral3.val : colors.neutral1.val),
  )
  const currentColor = shouldFadeDecimals && index > decimalSeparatorIndex ? colors.neutral3.val : colors.neutral1.val
  const yOffset = useSharedValue(digit && Number(digit) >= 0 ? DIGIT_HEIGHT * -digit : 0)

  const margin = {
    // add negative margin to the correct side of each character
    marginRight: isRightToLeft ? 0 : -ADDITIONAL_WIDTH_FOR_ANIMATIONS,
    marginLeft: isRightToLeft ? -ADDITIONAL_WIDTH_FOR_ANIMATIONS : 0,
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: +digit, currency
  useEffect(() => {
    const finishColor = shouldFadeDecimals && index > decimalSeparatorIndex ? colors.neutral3.val : colors.neutral1.val
    if (nextColor && index > commonPrefixLength - 1 && chars !== lastChars.current) {
      fontColor.value = withSequence(
        withTiming(nextColor, { duration: 250 }),
        withDelay(50, withTiming(finishColor, { duration: 310 })),
      )
      lastChars.current = chars
    } else {
      fontColor.value = finishColor
    }
  }, [
    digit,
    nextColor,
    colors.neutral3,
    index,
    chars,
    colors.neutral1,
    commonPrefixLength,
    fontColor,
    shouldFadeDecimals,
    currency,
    decimalSeparatorIndex,
  ])

  const animatedFontStyle = useAnimatedStyle(() => {
    return {
      color: fontColor.value,
    }
  }, [fontColor])

  const numbers = NUMBER_ARRAY.map((char, idx) => {
    // Web doesn't like standard Animated.Text custom fonts but Text from Tamagui doesn't like color animations
    return isWebPlatform ? (
      <Text
        key={idx}
        allowFontScaling={false}
        fontFamily="$heading"
        style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, color: nextColor ?? currentColor }]}
      >
        {char}
      </Text>
    ) : (
      <Animated.Text
        key={idx}
        allowFontScaling={false}
        style={[
          animatedFontStyle,
          AnimatedFontStyles.fontStyle,
          // fontFamily set to button style because android "Book" version of the font looks noticeably thinner
          { height: DIGIT_HEIGHT, fontFamily: fonts.buttonLabel1.family },
        ]}
      >
        {char}
      </Animated.Text>
    )
  })

  useEffect(() => {
    if (digit && Number(digit) >= 0) {
      const newOffset = DIGIT_HEIGHT * -digit
      yOffset.value = newOffset
    }
  })

  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withTiming(yOffset.value) }],
    }
  }, [yOffset])

  if (digit && !Number.isNaN(parseFloat(digit)) && Number(digit) >= 0) {
    return (
      <Animated.View
        style={[
          animatedWrapperStyle,
          {
            width: (NUMBER_WIDTH_ARRAY_SCALED[Number(digit)] || 0) + ADDITIONAL_WIDTH_FOR_ANIMATIONS,
            ...margin,
          },
        ]}
      >
        {numbers}
      </Animated.View>
    )
  } else {
    return isWebPlatform ? (
      <Text
        allowFontScaling={false}
        fontFamily="$heading"
        style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, color: currentColor }]}
      >
        {digit}
      </Text>
    ) : (
      <Animated.Text
        allowFontScaling={false}
        style={[
          animatedFontStyle,
          AnimatedFontStyles.fontStyle,
          { height: DIGIT_HEIGHT, fontFamily: fonts.buttonLabel1.family },
        ]}
      >
        {digit}
      </Animated.Text>
    )
  }
}

const Char = ({
  index,
  chars,
  currency,
  charsSizes,
  nextColor,
  commonPrefixLength,
  shouldFadeDecimals,
  isRightToLeft,
}: {
  index: number
  chars: string[]
  currency: FiatCurrencyInfo
  charsSizes: number[]
  nextColor?: string
  commonPrefixLength: number
  shouldFadeDecimals: boolean
  isRightToLeft: boolean
}): JSX.Element => {
  const animatedLeft = useAnimatedStyle(
    () => ({
      marginLeft: withTiming(charsSizes[index - 1] || 0),
    }),
    [charsSizes, index],
  )
  return (
    <Animated.View style={{ height: DIGIT_HEIGHT }}>
      <Animated.View
        style={[
          {
            height: DIGIT_HEIGHT,
            // Check if character can animate and if so make it DIGIT_MAX_WIDTH
            // to make sure it won't be cropped during animation
            width: NUMBER_WIDTH_ARRAY_SCALED[Number(chars[index])] && DIGIT_MAX_WIDTH,
            position: NUMBER_WIDTH_ARRAY_SCALED[Number(chars[index])] ? 'absolute' : 'relative',
          },
          AnimatedCharStyles.wrapperStyle,
          animatedLeft,
        ]}
      >
        <RollNumber
          chars={chars}
          commonPrefixLength={commonPrefixLength}
          currency={currency}
          digit={chars[index]}
          index={index}
          nextColor={nextColor}
          shouldFadeDecimals={shouldFadeDecimals}
          isRightToLeft={isRightToLeft}
        />
      </Animated.View>
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

const SCREEN_WIDTH_BUFFER = 50

// Used for initial layout larger than all screen sizes
const MAX_DEVICE_WIDTH = isWebPlatform ? undefined : 1000

type AnimatedNumberProps = {
  loadingPlaceholderText: string
  loading: boolean | 'no-shimmer'
  value?: string
  balance?: number
  colorIndicationDuration: number
  shouldFadeDecimals: boolean
  warmLoading: boolean
  disableAnimations?: boolean
  isRightToLeft: boolean
  EndElement?: JSX.Element
}

interface ReanimatedNumberProps extends AnimatedNumberProps {
  currency: FiatCurrencyInfo
}

const AnimatedNumber = (props: AnimatedNumberProps): JSX.Element => {
  const currency = useAppFiatCurrencyInfo()
  const colors = useSporeColors()

  if (props.disableAnimations) {
    const amountOfCurrency = props.value?.split(currency.decimalSeparator)
    if (amountOfCurrency?.length === 2) {
      return (
        <Text
          allowFontScaling={false}
          style={[
            AnimatedFontStyles.fontStyle,
            {
              color: colors.neutral1.val,
            },
          ]}
          testID={TestID.PortfolioBalance}
        >
          {amountOfCurrency[0]}
          <Text
            style={{
              color: colors.neutral3.val,
            }}
          >
            {currency.decimalSeparator}
            {amountOfCurrency[1]}
          </Text>
        </Text>
      )
    }
  }

  return <ReanimatedNumber {...props} currency={currency} />
}

const ReanimatedNumber = ({
  balance,
  currency,
  value,
  loading = false,
  loadingPlaceholderText,
  colorIndicationDuration,
  shouldFadeDecimals,
  warmLoading,
  isRightToLeft,
  EndElement,
}: ReanimatedNumberProps): JSX.Element => {
  const prevValue = usePrevious(value)
  const prevBalance = usePrevious(balance)
  const [commonPrefixLength, setCommonPrefixLength] = useState<number>(0)
  const [nextColor, setNextColor] = useState<string>()
  const scale = useSharedValue(1)
  const offset = useSharedValue(0)

  const colors = useSporeColors()

  const scaleWrapper = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -SCREEN_WIDTH / 2 }, { scale: scale.value }, { translateX: SCREEN_WIDTH / 2 }],
      display: 'flex',
      flexDirection: 'row',
    }
  }, [scale])

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
    if (balance && value && value !== prevValue) {
      if (prevBalance && balance > prevBalance) {
        setNextColor(colors.statusSuccess.val)
      } else if (prevBalance && balance < prevBalance) {
        setNextColor(colors.neutral2.val)
      } else {
        setNextColor(undefined)
      }
      setCommonPrefixLength(longestCommonPrefix(String(value), String(prevValue)).length)
      setTimeout(() => {
        setNextColor(undefined)
      }, colorIndicationDuration)
    }
  }, [colorIndicationDuration, colors.neutral2, colors.statusSuccess.val, prevBalance, balance, prevValue, value])

  const chars = useMemo(() => (value ? value.split('') : []), [value])
  /**
   * Since this component stitches together multiple characters in order to animate each
   * character separately, we need to calculate the size and each character including the
   * including the spacing between them.
   */
  const charsSizes = useMemo(() => {
    let lastSize = 0
    return chars.map((char) => {
      let currentSize = 0
      const isDigit = char >= '0' && char <= '9'
      const isAWhiteSpace = /\s/.test(char)
      if (isDigit) {
        const digitWidth = NUMBER_WIDTH_ARRAY_SCALED[Number(char)] || 0
        currentSize = lastSize + digitWidth + SPACE_SIZE
      } else if (isAWhiteSpace) {
        currentSize = lastSize + SPACE_SIZE
      }
      lastSize = currentSize
      return currentSize
    })
  }, [chars])

  const endElementLeft = charsSizes[chars.length - 1] || 0
  const iconAnimatedLeft = useAnimatedStyle(
    () => ({
      marginLeft: withTiming(endElementLeft + ICON_LEFT_MARGIN),
    }),
    [endElementLeft],
  )

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex borderRadius="$rounded4" flexDirection="row">
          <Text
            allowFontScaling={false}
            style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, fontFamily: fonts.buttonLabel1.family }]}
            opacity={0}
          >
            {loadingPlaceholderText}
          </Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  return (
    <Animated.View style={scaleWrapper} testID={TestID.PortfolioBalance}>
      <Flex
        group
        row
        alignItems="flex-start"
        backgroundColor="$surface1"
        borderRadius="$rounded4"
        width={MAX_DEVICE_WIDTH}
      >
        <TopAndBottomGradient />
        <Shine disabled={!warmLoading}>
          <Flex row animation="fast" width={MAX_DEVICE_WIDTH}>
            {chars.map((_, index) => (
              <Char
                key={index === 0 ? `$_sign_${colors.neutral1.val}` : `$_number_${chars.length - index}`}
                chars={chars}
                charsSizes={charsSizes}
                commonPrefixLength={commonPrefixLength}
                currency={currency}
                index={index}
                isRightToLeft={isRightToLeft}
                nextColor={nextColor}
                shouldFadeDecimals={shouldFadeDecimals}
              />
            ))}
          </Flex>
        </Shine>
        <Animated.Text
          allowFontScaling={false}
          style={[AnimatedFontStyles.invisible, AnimatedFontStyles.fontStyle]}
          onLayout={fitBalanceOnLayout}
        >
          {value}
        </Animated.Text>
        {EndElement && (
          <Animated.View key="refresh-icon" style={{ height: DIGIT_HEIGHT }}>
            <Animated.View
              style={[
                {
                  height: DIGIT_HEIGHT,
                  width: DIGIT_MAX_WIDTH,
                  position: 'absolute',
                  marginVertical: 'auto',
                  justifyContent: 'center',
                },
                AnimatedCharStyles.wrapperStyle,
                iconAnimatedLeft,
              ]}
            >
              {EndElement}
            </Animated.View>
          </Animated.View>
        )}
      </Flex>
    </Animated.View>
  )
}

export default AnimatedNumber

interface AnimatedFontStylesType {
  fontStyle: TextStyle
  invisible: TextStyle
}

interface AnimatedCharStylesType {
  wrapperStyle: ViewStyle
}

export const AnimatedCharStyles: AnimatedCharStylesType = {
  wrapperStyle: {
    overflow: 'hidden',
  },
}

export const AnimatedFontStyles: AnimatedFontStylesType = {
  fontStyle: {
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
}
