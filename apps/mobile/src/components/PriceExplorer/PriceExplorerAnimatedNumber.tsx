import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {
  ADDITIONAL_WIDTH_FOR_ANIMATIONS,
  AnimatedCharStyles,
  AnimatedFontStyles,
  DIGIT_HEIGHT,
  NUMBER_ARRAY,
  NUMBER_WIDTH_ARRAY,
  TopAndBottomGradient,
} from 'src/components/AnimatedNumber'
import { ValueAndFormatted } from 'src/components/PriceExplorer/usePrice'
import { PriceNumberOfDigits } from 'src/components/PriceExplorer/usePriceHistory'
import { useSporeColors } from 'ui/src'
import { TextLoaderWrapper } from 'ui/src/components/text/Text'
import { FiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'

const NumbersMain = ({
  color,
  backgroundColor,
  hidePlacehodler,
}: {
  color: string
  backgroundColor: string
  hidePlacehodler(): void
}): JSX.Element | null => {
  const [showNumers, setShowNumbers] = useState(false)
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
    hidePlacehodler()
    hideNumbers.value = false
  }

  if (showNumers) {
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
        onLayout={onLayout}>
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
  hidePlacehodler,
  commaIndex,
  currency,
}: {
  chars: SharedValue<string>
  index: number
  shouldAnimate: SharedValue<boolean>
  decimalPlace: SharedValue<number>
  hidePlacehodler(): void
  commaIndex: number
  currency: FiatCurrencyInfo
}): JSX.Element => {
  const colors = useSporeColors()

  const animatedDigit = useDerivedValue(() => {
    const char = chars.value[index - (commaIndex - decimalPlace.value)]
    const number = char ? parseFloat(char) : undefined
    return Number.isNaN(number) ? undefined : number
  }, [chars])

  const animatedFontStyle = useAnimatedStyle(() => {
    const color = index >= commaIndex ? colors.neutral3.val : colors.neutral1.val
    return {
      color,
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
  }, [shouldAnimate])

  const animatedWrapperStyle = useAnimatedStyle(() => {
    const digitWidth =
      animatedDigit.value !== undefined ? NUMBER_WIDTH_ARRAY[animatedDigit.value] ?? 0 : 0
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

  if (index === commaIndex) {
    return (
      <Animated.Text
        allowFontScaling={false}
        style={[
          animatedFontStyle,
          AnimatedFontStyles.fontStyle,
          { height: DIGIT_HEIGHT, backgroundColor: colors.surface1.val },
        ]}>
        {currency.decimalSeparator}
      </Animated.Text>
    )
  }

  if (
    (index - commaIndex) % 4 === 0 &&
    index - commaIndex < 0 &&
    index > commaIndex - decimalPlace.value
  ) {
    return (
      <Animated.Text
        allowFontScaling={false}
        style={[
          animatedFontStyle,
          AnimatedFontStyles.fontStyle,
          { height: DIGIT_HEIGHT, backgroundColor: colors.surface1.val },
        ]}>
        {currency.groupingSeparator}
      </Animated.Text>
    )
  }

  return (
    <Animated.View
      style={[
        animatedWrapperStyle,
        {
          marginRight: -ADDITIONAL_WIDTH_FOR_ANIMATIONS,
        },
      ]}>
      <MemoizedNumbers
        backgroundColor={colors.surface1.val}
        color={index >= commaIndex ? colors.neutral3.val : colors.neutral1.val}
        hidePlacehodler={hidePlacehodler}
      />
    </Animated.View>
  )
}

const Numbers = ({
  price,
  hidePlacehodler,
  numberOfDigits,
  currency,
}: {
  price: ValueAndFormatted
  hidePlacehodler(): void
  numberOfDigits: PriceNumberOfDigits
  currency: FiatCurrencyInfo
}): JSX.Element[] => {
  const chars = useDerivedValue(() => {
    return price.formatted.value
  }, [price])

  const decimalPlace = useDerivedValue(() => {
    return price.formatted.value.indexOf(currency.decimalSeparator)
  }, [price])

  return _.times(
    numberOfDigits.left + numberOfDigits.right + Math.floor(numberOfDigits.left / 3) + 1,
    (index) => (
      <Animated.View style={[{ height: DIGIT_HEIGHT }, AnimatedCharStyles.wrapperStyle]}>
        <RollNumber
          key={index === 0 ? `$sign` : `$_number_${numberOfDigits.left - 1 - index}`}
          chars={chars}
          commaIndex={numberOfDigits.left + Math.floor(numberOfDigits.left / 3)}
          currency={currency}
          decimalPlace={decimalPlace}
          hidePlacehodler={hidePlacehodler}
          index={index}
          shouldAnimate={price.shouldAnimate}
        />
      </Animated.View>
    )
  )
}

const LoadingWrapper = (): JSX.Element | null => {
  return (
    <TextLoaderWrapper loadingShimmer={false}>
      <View style={Shimmer.shimmerSize} />
    </TextLoaderWrapper>
  )
}

const PriceExplorerAnimatedNumber = ({
  price,
  numberOfDigits,
  currency,
}: {
  price: ValueAndFormatted
  numberOfDigits: PriceNumberOfDigits
  currency: FiatCurrencyInfo
}): JSX.Element => {
  const colors = useSporeColors()
  const hideShimmer = useSharedValue(false)
  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: price.value.value > 0 && hideShimmer.value ? 0 : 1,
      position: 'absolute',
      zIndex: 1000,
      backgroundColor: colors.surface1.val,
    }
  })

  const hidePlacehodler = (): void => {
    hideShimmer.value = true
  }

  const currencySymbol = (
    <Text
      allowFontScaling={false}
      style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, color: colors.neutral1.val }]}>
      {currency.fullSymbol}
    </Text>
  )

  return (
    <>
      <Animated.View style={animatedWrapperStyle}>
        <LoadingWrapper />
      </Animated.View>
      <View style={RowWrapper.wrapperStyle}>
        <TopAndBottomGradient />
        {currency.symbolAtFront && currencySymbol}
        {Numbers({ price, hidePlacehodler, numberOfDigits, currency })}
        {!currency.symbolAtFront && currencySymbol}
      </View>
    </>
  )
}

export default PriceExplorerAnimatedNumber

export const RowWrapper = StyleSheet.create({
  wrapperStyle: {
    flexDirection: 'row',
  },
})

export const Shimmer = StyleSheet.create({
  shimmerSize: {
    height: DIGIT_HEIGHT,
    width: 200,
  },
})
