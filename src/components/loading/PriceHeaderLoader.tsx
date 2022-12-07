import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'

export function PriceHeaderLoader() {
  const theme = useAppTheme()

  return (
    <Box mx="sm">
      {/* TODO(loader refactor): replace this with the text loading component so it scales automatically. */}
      <Box height={theme.textVariants.headlineLarge.lineHeight} justifyContent="center">
        <Box backgroundColor="background3" borderRadius="sm" height="80%" width="30%" />
      </Box>
      <Box height={theme.textVariants.bodyLarge.lineHeight} justifyContent="center">
        <Box backgroundColor="background3" borderRadius="sm" height="80%" width="10%" />
      </Box>
    </Box>
  )
}
