import React from 'react'
import { Text, TextProps } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type DecimalNumberProps = TextProps & {
  number: string
  separator?: string
  variant: keyof Theme['textVariants']
}

// Utility component to display decimal numbers where the decimal part
// is dimmed
export function DecimalNumber({ number, separator = '.', variant, ...rest }: DecimalNumberProps) {
  const [pre, post] = number.split(separator)

  return (
    <Text variant={variant} {...rest}>
      {pre}
      {post && (
        <Text color="textTertiary" variant={variant}>
          {separator}
          {post}
        </Text>
      )}
    </Text>
  )
}
