import React, { useMemo } from 'react'
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { TextProps } from 'src/components/Text'
import { AnimatedText } from 'src/components/text/AnimatedText'
import { Theme } from 'ui/src/theme/restyle'
import { ValueAndFormatted } from './usePrice'

type AnimatedDecimalNumberProps = TextProps & {
  number: ValueAndFormatted
  separator?: string
  variant: keyof Theme['textVariants']
  wholePartColor?: string
  decimalPartColor?: string
  decimalThreshold?: number // below this value (not including) decimal part would have wholePartColor too
}

// Utility component to display decimal numbers where the decimal part
// is dimmed using AnimatedText
export function AnimatedDecimalNumber(props: AnimatedDecimalNumberProps): JSX.Element {
  const theme = useAppTheme()

  const {
    number,
    separator = '.',
    variant,
    wholePartColor = theme.colors.neutral1,
    decimalPartColor = theme.colors.neutral3,
    decimalThreshold = 1,
    ...rest
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
    <Box flexDirection="row" {...rest}>
      <AnimatedText style={wholeStyle} testID="wholePart" text={wholePart} variant={variant} />
      <AnimatedText
        style={decimalStyle}
        testID="decimalPart"
        text={decimalPart}
        variant={variant}
      />
    </Box>
  )
}
