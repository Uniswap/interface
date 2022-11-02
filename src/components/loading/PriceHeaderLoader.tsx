import React from 'react'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function PriceHeaderLoader() {
  return (
    <Box mx="sm">
      <Text loaderOnly height="80%%" variant="headlineLarge" width="40%">
        $1.00
      </Text>
      <Text loaderOnly variant="bodySmall" width="20%">
        0.01
      </Text>
    </Box>
  )
}
