import React from 'react'
import { Box } from 'src/components/layout'

/* Box with a line at the bottom */
export function HeaderLoader() {
  return (
    <Box>
      <Box
        backgroundColor="deprecated_gray50"
        borderRadius="md"
        height={50}
        marginBottom="sm"
        width="100%"
      />
      <Box
        backgroundColor="deprecated_gray50"
        borderRadius="md"
        height={10}
        marginBottom="sm"
        width="100%"
      />
    </Box>
  )
}
