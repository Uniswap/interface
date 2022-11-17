import React from 'react'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function PriceHeaderLoader() {
  return (
    <Box mx="sm">
      <Text
        loading
        height="80%%"
        loadingPlaceholderText="$1.00"
        variant="headlineLarge"
        width="40%"
      />
      <Text loading loadingPlaceholderText="0.01" variant="bodyLarge" width="20%" />
    </Box>
  )
}
