import React from 'react'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'

// TODO(loader refactor): remove this and add inline to PriceChartLoading.tsx
export function PriceHeaderLoader() {
  return (
    <Box mx="sm">
      <Text loading loadingPlaceholderText="$100.00" numberOfLines={1} variant="headlineLarge" />
      <Text loading loadingPlaceholderText="1.00 %" numberOfLines={1} variant="bodyLarge" />
    </Box>
  )
}
