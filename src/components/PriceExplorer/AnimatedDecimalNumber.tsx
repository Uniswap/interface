import React from 'react'
import { SharedValue, useDerivedValue } from 'react-native-reanimated'
import { TextProps } from 'src/components/Text'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { Theme } from 'src/styles/theme'
import { Box } from '../layout'

type AnimatedDecimalNumberProps = TextProps & {
  number: SharedValue<string>
  separator?: string
  variant: keyof Theme['textVariants']
  wholePartColor?: keyof Theme['colors']
  decimalPartColor?: keyof Theme['colors']
}

// Utility component to display decimal numbers where the decimal part
// is dimmed using AnimatedText
export function AnimatedDecimalNumber({
  number,
  separator = '.',
  variant,
  wholePartColor = 'textPrimary',
  decimalPartColor = 'textTertiary',
  ...rest
}: AnimatedDecimalNumberProps): JSX.Element {
  const wholePart = useDerivedValue(
    () => number.value.split(separator)[0] || '',
    [number, separator]
  )
  const decimalPart = useDerivedValue(
    () => separator + (number.value.split(separator)[1] || ''),
    [number, separator]
  )

  return (
    <Box flexDirection="row" {...rest}>
      <AnimatedText color={wholePartColor} testID="wholePart" text={wholePart} variant={variant} />
      <AnimatedText
        color={decimalPartColor}
        testID="decimalPart"
        text={decimalPart}
        variant={variant}
      />
    </Box>
  )
}
