import { SCREEN_WIDTH } from '@gorhom/bottom-sheet'
import times from 'lodash/times'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { ValueAndFormattedWithAnimation } from 'src/components/PriceExplorer/usePrice'
import { PriceNumberOfDigits } from 'src/components/PriceExplorer/usePriceHistory'
import { TextLoaderWrapper, useSporeColors } from 'ui/src'
import { fonts } from 'ui/src/theme'
import {
  ADDITIONAL_WIDTH_FOR_ANIMATIONS,
  AnimatedCharStyles,
  DIGIT_HEIGHT,
  NUMBER_ARRAY,
  NUMBER_WIDTH_ARRAY,
} from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TopAndBottomGradient } from 'uniswap/src/components/AnimatedNumber/TopAndBottomGradient'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// if price per token has > 3 numbers before the decimal, start showing decimals in neutral3
// otherwise, show entire price in neutral1
const DEEMPHASIZED_DECIMALS_THRESHOLD = 3

function getEmphasizedNumberColor({
  index,
  commaIndex,
  emphasizedColor,
  deemphasizedColor,
}: {
  index: number
  commaIndex: number
  emphasizedColor: string
  deemphasizedColor: string
}): string {
  if (index >= commaIndex && commaIndex > DEEMPHASIZED_DECIMALS_THRESHOLD) {
    return deemphasizedColor
  }
  return emphasizedColor
}

const shouldUseSeparator = ({
  index,
  commaIndex,
  decimalPlaceIndex,
}: {
  index: number
  commaIndex: number
  decimalPlaceIndex: number
}): boolean => {
  'worklet'
  return (index - commaIndex) % 4 === 0 && index - commaIndex < 0 && index > commaIndex - decimalPlaceIndex
}

const NumbersMain = ({
  color,
  backgroundColor,
  hidePlaceholder,
}: {
  color: string
  backgroundColor: string
  hidePlaceholder(): void
}): JSX.Element | null => {
  const [showNumbers, setShowNumbers] = useState(false)
  const hideNumbers = useSharedValue(true)

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: hideNumbers.value ? 0 : 1,
    }
  })

  useEffect(() => {
    setTimeout(() => {
      setShowNumbers(true)
    }, 200)
  }, [])

  const onLayout = (): void => {
    hidePlaceholder()
    hideNumbers.value = false
  }

  if (showNumbers) {
    return (
      <Animated.Text
        allowFontScaling={false}
        style={[
          AnimatedFontStyles.fontStyle,
          {
            height: DIGIT_HEIGHT * 10,
            color,
            backgroundColor,
          },
          animatedTextStyle,
        ]}
        onLayout={onLayout}
      >
        {NUMBER_ARRAY}
      </Animated.Text>
    )
  }

  return null
}

const MemoizedNumbers = React.memo(NumbersMain)

const RollNumber = ({
  chars,
  index,
  shouldAnimate,
  decimalPlace,
  hidePlaceholder,
  commaIndex,
  currency,
}: {
  chars: SharedValue<string>
  index: number
  shouldAnimate: SharedValue<boolean>
  decimalPlace: SharedValue<number>
  hidePlaceholder(): void
  commaIndex: number
  currency: FiatCurrencyInfo
}): JSX.Element => {
  const colors = useSporeColors()
  const numberColor = getEmphasizedNumberColor({
    index,
    commaIndex,
    emphasizedColor: colors.neutral1.val,
    deemphasizedColor: colors.neutral3.val,
  })

  const animatedDigit = useDerivedValue(() => {
    const char = chars.value[index - (commaIndex - decimalPlace.value)]
    const number = char ? parseFloat(char) : undefined
    return Number.isNaN(number) ? undefined : number
  }, [chars, commaIndex, decimalPlace, index])

  const animatedFontStyle = useAnimatedStyle(() => {
    return {
      color: numberColor,
    }
  })

  const transformY = useDerivedValue(() => {
    const endValue = animatedDigit.value !== undefined ? DIGIT_HEIGHT * -animatedDigit.value : 0

    return shouldAnimate.value
      ? withSpring(endValue, {
          mass: 1,
          damping: 29,
          stiffness: 164,
          overshootClamping: false,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 2,
        })
      : endValue
  }, [animatedDigit, shouldAnimate])

  const animatedWrapperStyle = useAnimatedStyle(() => {
    const digitWidth = animatedDigit.value !== undefined ? (NUMBER_WIDTH_ARRAY[animatedDigit.value] ?? 0) : 0
    const rowWidth = digitWidth + ADDITIONAL_WIDTH_FOR_ANIMATIONS - 7

    return {
      transform: [
        {
          translateY: transformY.value,
        },
      ],
      width: shouldAnimate.value ? withTiming(rowWidth) : rowWidth,
    }
  })

  // need it in case the current value is eg $999.00 but maximum value in chart is more than $1,000.00
  // so it can hide the comma to avoid something like $,999.00
  const animatedWrapperSeparatorStyle = useAnimatedStyle(() => {
    if (!shouldUseSeparator({ index, commaIndex, decimalPlaceIndex: decimalPlace.value })) {
      return {
        width: withTiming(0),
      }
    }

    const digitWidth = chars.value[index - (commaIndex - decimalPlace.value)] === currency.groupingSeparator ? 8 : 0

    const rowWidth = Math.max(digitWidth, 0)

    return {
      transform: [
        {
          translateY: transformY.value,
        },
      ],
      width: shouldAnimate.value ? withTiming(rowWidth) : rowWidth,
    }
  })

  if (index === commaIndex) {
    return (
      <Animated.Text
        allowFontScaling={false}
        style={[
          animatedFontStyle,
          AnimatedFontStyles.fontStyle,
          { height: DIGIT_HEIGHT, backgroundColor: colors.surface1.val },
        ]}
      >
        {currency.decimalSeparator}
      </Animated.Text>
    )
  }

  if ((index - commaIndex) % 4 === 0 && index - commaIndex < 0) {
    return (
      <Animated.View style={animatedWrapperSeparatorStyle}>
        <Animated.Text
          allowFontScaling={false}
          style={[
            animatedFontStyle,
            AnimatedFontStyles.fontStyle,
            { height: DIGIT_HEIGHT, backgroundColor: colors.surface1.val },
          ]}
        >
          {currency.groupingSeparator}
        </Animated.Text>
      </Animated.View>
    )
  }

  return (
    <Animated.View
      style={[
        animatedWrapperStyle,
        {
          marginRight: -ADDITIONAL_WIDTH_FOR_ANIMATIONS,
        },
      ]}
    >
      <MemoizedNumbers backgroundColor={colors.surface1.val} color={numberColor} hidePlaceholder={hidePlaceholder} />
    </Animated.View>
  )
}

const Numbers = ({
  price,
  hidePlaceholder,
  numberOfDigits,
  currency,
}: {
  price: ValueAndFormattedWithAnimation
  hidePlaceholder(): void
  numberOfDigits: PriceNumberOfDigits
  currency: FiatCurrencyInfo
}): JSX.Element[] => {
  const chars = useDerivedValue(() => {
    return price.formatted.value
  }, [price])

  const decimalPlace = useDerivedValue(() => {
    return price.formatted.value.indexOf(currency.decimalSeparator)
  }, [currency.decimalSeparator, price.formatted])

  const commaIndex = numberOfDigits.left + Math.floor((numberOfDigits.left - 1) / 3)

  return times(numberOfDigits.left + numberOfDigits.right + Math.floor((numberOfDigits.left - 1) / 3) + 1, (index) => (
    <Animated.View
      key={`$number_${index - commaIndex}`}
      style={[{ height: DIGIT_HEIGHT }, AnimatedCharStyles.wrapperStyle]}
    >
      <RollNumber
        key={`$number_${index - commaIndex}`}
        chars={chars}
        commaIndex={commaIndex}
        currency={currency}
        decimalPlace={decimalPlace}
        hidePlaceholder={hidePlaceholder}
        index={index}
        shouldAnimate={price.shouldAnimate}
      />
    </Animated.View>
  ))
}

function LoadingWrapper(): JSX.Element | null {
  return (
    <TextLoaderWrapper loadingShimmer={false}>
      <View style={Shimmer.shimmerSize} />
    </TextLoaderWrapper>
  )
}

const SCREEN_WIDTH_BUFFER = 50

function PriceExplorerAnimatedNumber({
  price,
  numberOfDigits,
  currency,
  onAnimatedNumberReady,
}: {
  price: ValueAndFormattedWithAnimation
  numberOfDigits: PriceNumberOfDigits
  currency: FiatCurrencyInfo
  onAnimatedNumberReady: () => void
}): JSX.Element {
  const colors = useSporeColors()
  const hideShimmer = useSharedValue(false)
  const scale = useSharedValue(1)
  const offset = useSharedValue(0)
  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: price.value.value > 0 && hideShimmer.value ? 0 : 1,
      position: 'absolute',
      zIndex: 1000,
      backgroundColor: colors.surface1.val,
    }
  })

  const lessThanStyle = useAnimatedStyle(() => {
    return {
      width: price.formatted.value[0] === '<' ? withTiming(22) : withTiming(0),
    }
  })

  useAnimatedReaction(
    () => {
      return Number(
        [0, ...price.formatted.value.split('')].reduce((accumulator, currentValue) => {
          if (NUMBER_WIDTH_ARRAY[Number(currentValue)]) {
            return Number(accumulator) + Number(NUMBER_WIDTH_ARRAY[Number(currentValue)])
          }
          return accumulator
        }),
      )
    },
    (priceWidth: number) => {
      const newScale = (SCREEN_WIDTH - SCREEN_WIDTH_BUFFER) / priceWidth

      if (newScale < 1) {
        const newOffset = (priceWidth - priceWidth * newScale) / 2
        scale.value = withTiming(newScale)
        offset.value = withTiming(-newOffset)
      } else if (scale.value < 1) {
        scale.value = withTiming(1)
        offset.value = withTiming(0)
      }
    },
  )

  const hidePlaceholder = (): void => {
    hideShimmer.value = true
    onAnimatedNumberReady()
  }

  const currencySymbol = (
    <Text
      allowFontScaling={false}
      style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, color: colors.neutral1.val }]}
    >
      {currency.fullSymbol}
    </Text>
  )

  const lessThanSymbol = (
    <Animated.Text
      allowFontScaling={false}
      style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, color: colors.neutral1.val }, lessThanStyle]}
    >
      {'<'}
    </Animated.Text>
  )

  const scaleWraper = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -SCREEN_WIDTH / 2 }, { scale: scale.value }, { translateX: SCREEN_WIDTH / 2 }],
    }
  })

  return (
    <Animated.View style={scaleWraper}>
      <Animated.View style={animatedWrapperStyle}>
        <LoadingWrapper />
      </Animated.View>
      <View style={RowWrapper.wrapperStyle} testID={TestID.PriceExplorerAnimatedNumber}>
        <TopAndBottomGradient />
        {lessThanSymbol}
        {currency.symbolAtFront && currencySymbol}
        {Numbers({ price, hidePlaceholder, numberOfDigits, currency })}
        {!currency.symbolAtFront && currencySymbol}
      </View>
    </Animated.View>
  )
}

export default PriceExplorerAnimatedNumber

const RowWrapper = StyleSheet.create({
  wrapperStyle: {
    flexDirection: 'row',
  },
})

const Shimmer = StyleSheet.create({
  shimmerSize: {
    height: DIGIT_HEIGHT,
    width: 200,
  },
})

const AnimatedFontStyles = StyleSheet.create({
  fontStyle: {
    fontFamily: fonts.heading2.family,
    fontSize: fonts.heading2.fontSize,
    fontWeight: fonts.heading2.fontWeight,
    lineHeight: fonts.heading2.lineHeight,
  },
})
