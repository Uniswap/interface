import React, { ComponentProps, PropsWithChildren } from 'react'
import { Box } from 'src/components/layout/Box'

type Props = ComponentProps<typeof Box>

// Fills up entire parent by default
export function GradientBackground({ children, ...rest }: PropsWithChildren<Props>) {
  return (
    <Box position="absolute" top={0} left={0} bottom={0} right={0} zIndex="background" {...rest}>
      {children}
    </Box>
  )
}
