import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { theme } from 'src/styles/theme'

/* Box with a line at the bottom */
export function HeaderLoader() {
  return (
    <Flex gap="xxs">
      <Box
        backgroundColor="backgroundAction"
        borderRadius="xs"
        height={theme.textVariants.headlineLarge.lineHeight}
        width="50%"
      />
      <Box
        backgroundColor="backgroundAction"
        borderRadius="xs"
        height={theme.textVariants.bodySmall.lineHeight}
        width="20%"
      />
    </Flex>
  )
}
