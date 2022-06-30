import React from 'react'
import { Box } from 'src/components/layout'

export function BoxLoader({ height = 50 }: { height?: number }) {
  return (
    <Box
      backgroundColor="deprecated_gray50"
      borderRadius="md"
      height={height}
      marginBottom="sm"
      width="100%"
    />
  )
}
