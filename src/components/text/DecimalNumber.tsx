import React from 'react'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type DecimalNumberProps = {
  number: string
  separator?: string
  variant: keyof Theme['textVariants']
}

// Utility component to display decimal numbers where the decimal part
// is dimmed
export function DecimalNumber({ number, separator = '.', variant }: DecimalNumberProps) {
  const [pre, post] = number.split(separator)

  return (
    <Text variant={variant}>
      {pre}
      {post && (
        <Text color="textTertiary">
          {separator}
          {post}
        </Text>
      )}
    </Text>
  )
}
