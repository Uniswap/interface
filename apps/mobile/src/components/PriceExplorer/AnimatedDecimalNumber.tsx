import React, { memo, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ValueAndFormatted } from 'src/components/PriceExplorer/usePrice'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { Flex, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { fonts, TextVariantTokens } from 'ui/src/theme'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'

type AnimatedDecimalNumberProps = {
  number: ValueAndFormatted
  separator: string
  variant: TextVariantTokens
  wholePartColor?: string
  decimalPartColor?: string
  decimalThreshold?: number // below this value (not including) decimal part would have wholePartColor too
  testID?: TestIDType
  maxWidth?: number
  maxCharPixelWidth?: number
}

/**
 * TODO(MOB-1948): AnimatePresence should be able to do this:
 *
 *   Example: https://gist.github.com/natew/e773fa3bdc99f75a3b28f21db168a449
 *
 */

// Utility component to display decimal numbers where the decimal part
// is dimmed using AnimatedText
export const AnimatedDecimalNumber = memo(function AnimatedDecimalNumber(
  props: AnimatedDecimalNumberProps,
): JSX.Element {
  const colors = useSporeColors()
  const { fullWidth } = useDeviceDimensions()
  const { fontScale } = useWindowDimensions()

  const {
    number,
    separator,
    variant,
    wholePartColor = colors.neutral1.val,
    decimalPartColor = colors.neutral3.val,
    decimalThreshold = 1,
    testID,
    maxWidth = fullWidth,
    maxCharPixelWidth: maxCharPixelWidthProp,
  } = props

  const wholePart = useDerivedValue(() => number.formatted.value.split(separator)[0] || '', [number, separator])
  const decimalPart = useDerivedValue(
    () => separator + (number.formatted.value.split(separator)[1] || ''),
    [number, separator],
  )

  const wholeStyle = useMemo(() => {
    return {
      color: wholePartColor,
    }
  }, [wholePartColor])

  const decimalStyle = useAnimatedStyle(() => {
    return {
      color: number.value.value < decimalThreshold ? wholePartColor : decimalPartColor,
    }
  }, [number.value, decimalThreshold, wholePartColor, decimalPartColor])

  const fontSize = fonts[variant].fontSize * fontScale
  // Choose the arbitrary value that looks good for the font used
  const maxCharPixelWidth = maxCharPixelWidthProp ?? (2 / 3) * fontSize

  const adjustedFontSize = useDerivedValue(() => {
    const value = number.formatted.value
    const approxWidth = value.length * maxCharPixelWidth

    if (approxWidth <= maxWidth) {
      return fontSize
    }

    const scale = Math.min(1, maxWidth / approxWidth)
    return fontSize * scale
  })

  const animatedStyle = useAnimatedStyle(() => ({
    fontSize: adjustedFontSize.value,
  }))

  return (
    <Flex row testID={testID}>
      <AnimatedText style={[wholeStyle, animatedStyle]} testID="wholePart" text={wholePart} variant={variant} />
      {decimalPart.value !== separator && (
        <AnimatedText style={[decimalStyle, animatedStyle]} testID="decimalPart" text={decimalPart} variant={variant} />
      )}
    </Flex>
  )
})
