import React from 'react'
import { Box, BoxProps } from 'src/components/layout/Box'

// Fills up entire parent by default
export function GradientBackground({ children, ...rest }: BoxProps): JSX.Element {
  return (
    <Box bottom={0} left={0} position="absolute" right={0} top={0} zIndex="background" {...rest}>
      {children}
    </Box>
  )
}
