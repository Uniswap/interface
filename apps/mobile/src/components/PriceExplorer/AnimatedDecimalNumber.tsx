import React, { useMemo } from 'react'
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { Flex, useSporeColors } from 'ui/src'
import { TextVariantTokens } from 'ui/src/theme'
import { ValueAndFormatted } from './usePrice'

type AnimatedDecimalNumberProps = {
  number: ValueAndFormatted
  separator: string
  variant: TextVariantTokens
  wholePartColor?: string
  decimalPartColor?: string
  decimalThreshold?: number // below this value (not including) decimal part would have wholePartColor too
  testID?: string
}

// Utility component to display decimal numbers where the decimal part
// is dimmed using AnimatedText
export function AnimatedDecimalNumber(props: AnimatedDecimalNumberProps): JSX.Element {
  const colors = useSporeColors()

  const {
    number,
    separator,
    variant,
    wholePartColor = colors.neutral1.val,
    decimalPartColor = colors.neutral3.val,
    decimalThreshold = 1,
    testID,
  } = props

  const wholePart = useDerivedValue(
    () => number.formatted.value.split(separator)[0] || '',
    [number, separator]
  )
  const decimalPart = useDerivedValue(
    () => separator + (number.formatted.value.split(separator)[1] || ''),
    [number, separator]
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
  }, [decimalThreshold, wholePartColor, decimalPartColor])

  return (
    <Flex row testID={testID}>
      <AnimatedText style={wholeStyle} testID="wholePart" text={wholePart} variant={variant} />
      {decimalPart.value !== separator && (
        <AnimatedText
          style={decimalStyle}
          testID="decimalPart"
          text={decimalPart}
          variant={variant}
        />
      )}
    </Flex>
  )
}
